from bson import InvalidDocument
from collections import deque
from datetime import datetime
from pymongo.collection import Collection
from socket import gethostname
from threading import Thread
from uuid import uuid
from Queue import Queue
import pickle
import logging
import os
import sys

"""
Based on the handler written by Andrei Savu:
    https://github.com/andreisavu/mongodb-log
"""
try:
    from pymongo import MongoClient as Connection
except ImportError:
    from pymongo import Connection

if sys.version_info[0] >= 3:
    unicode = str


class MongoFormatter(logging.Formatter):
    """A simple formatter that adds some mild timestamp formatting"""


    def format(self, record):
        data = record.__dict__.copy()

        # format the message with the arguments if any exist
        if record.args is not None:
            record.msg = record.msg % record.args

        local_time = str(datetime.fromtimestamp(float(str(data['created'])
            + '.' + str(data['msecs']))))[:-4]
        data.update(
            timestamp=local_time,
            host=gethostname(),
            message=record.msg
        )
        if 'exc_info' in data and data['exc_info'] is not None:
            data['exc_info'] = self.formatException(data['exc_info'])
        return data



class ThreadedHandler(logging.Handler):
    """
    A simple pseudo-abstract handler that runs a thread for emitting logRecords.
    """


    # A special queueable item to tell the worker thread to exit
    EXIT_THREAD = uuid.uuid1()

    def __init__(self, level=logging.NOTSET):
        logging.Handler.__init__(self, level)
        self.message_queue = Queue()
        self.exiting = False
        Thread(target=self.run_thread).start()


    def __del__(self):
        self.exiting = True


    def emit(self, record):
        self.message_queue.put(record)


    def handle_records(self):
        raise NotImplementedError()

    def run_thread(self):
        while True:
            self.handle_records()
            if self.exiting is True:
                break


class MongoHandler(ThreadedHandler):
    """A threaded logging handler that writes to a Mongo database"""


    def __init__(self, unsent_records_path, collection, db='mongolog', 
            host='localhost', port=None, username=None, password=None, 
            level=logging.NOTSET):
        ThreadedHandler.__init__(self, level)
        self.unsent_records_path = unsent_records_path
        if isinstance(collection, str):
            connection = Connection(host, port)
            if username and password:
                connection[db].authenticate(username, password)
            self.collection = connection[db][collection]
        elif isinstance(collection, Collection):
            self.collection = collection
        else:
            raise TypeError('collection must be instance of basestring or '
                             'Collection')
        self.formatter = MongoFormatter()


    def __del__(self):
        ThreadedHandler.__del__(self)


    def get_unsent_items(self):
        unsent_items = deque()
        try:
            if os.path.exists(self.unsent_records_path):
                reader = open(self.unsent_records_path, 'rb')
                while True:
                    unsent_items.append(pickle.load(reader))
        except EOFError:
            reader.close()
        return unsent_items


    def pickle_unsent_items(self, unsent_items):
            writer = open(self.unsent_records_path, 'wb')
            while unsent_items.count > 0:
                record = unsent_items.pop()
                pickle.dump(record, writer)
            writer.close()


    def handle_records(self):
        """Tries to send all records to Mongo db"""
        while True:
            if self.exiting is True:
                break
            unsent_items = self.get_unsent_items()
            try:
                # blocks until there is an item in the Queue
                current = self.message_queue.get(True)
                if current == ThreadedHandler.EXIT_THREAD:
                    self.exiting = True
                else:
                    unsent_items.append(current)
                    self.message_queue.task_done()
                    while unsent_items.count > 0:
                        record = unsent_items.pop()
                        self.collection.insert(self.format(record))
                    os.remove(self.unsent_records_path)
            except InvalidDocument:
                unsent_items.append(record)
                self.pickle_unsent_items(unsent_items)

# Install ZMQ and install its ioloop before initializing tornado
import zmq
from zmq.eventloop import ioloop
from zmq.eventloop.zmqstream import ZMQStream
ioloop.install()

#Initialize tornado
import tornado.httpserver
import tornado.websocket
from tornado.ioloop import IOLoop
import tornado.web
from tornado.options import define, options
import geocodeworker
import geospatialworker
import json


# Global Options
define("port", default=7000)
define("geocode_workurl", default="tcp://127.0.0.1:9000")
define("geospatial_workurl", default="tcp://127.0.0.1:9001")
define("resulturl", default="tcp://127.0.0.1:9002")
define("licensefile", default="pxpoint.lic")
define("licensekey", default=123456789)
define("dataset_root", default="/mnt/data/PxPoint_2013_12")
define("datacatalog_path", default="datacatalog.xml")
define("pxse_dir", default="error-in-gissocket")

# Global WebSocket multiplexer
webSocketID = 0   
webSocketClients = {}


class WSHandler(tornado.websocket.WebSocketHandler):
    """WebSocket Handler class"""

    def open(self):
        """Handler for open connections
           On connection setup, sets up identifier for this websocket connection
           and setup multiplex dictionary for this instance
        """
        global webSocketID
        webSocketID = webSocketID + 1
        self.socketid = webSocketID        
        webSocketClients[webSocketID] = self

        print 'New connection: %d' % self.socketid
      
    def on_message(self, message):
        """Handler for Receiving Messages
           Gets the message on Websocket and relays it to the network of GeocodeWorker
        """
        try:
            input_val = json.loads(message)
            input_val['WebSocketId'] = self.socketid
            operation_name = input_val['Operation']
            if operation_name == 'geocode':
                sockpush_geocode_stream.send_json(input_val)
            elif operation_name == 'query':
                sockpush_spatial_stream.send_json(input_val)
            else:
                raise Exception('unrecognized operation %s' % str(operation_name))
        except Exception as ex:
            self.write_message(json.dumps({'Status': 'INVALID_ARGUMENT', 
                                           'Message':'Cannot parse Json message'}))

    def on_close(self):
        """Handler for connection close
          Deletes the instance from multiplex dictionary
        """
        del webSocketClients[self.socketid]
        print 'Connection closed: %d' % self.socketid


def handle_geocode_result(msg):
    """Handle for resutls from Geocode Worker 
       This function sends the correct message to appropriate web socket client
       which is identified by INPUT.Id field
    """
    output = json.loads(msg[0])
    multiplex_stream_id = int(output["result"][0]['INPUT.Id'])
    if(multiplex_stream_id in webSocketClients):
        webSocketClients[multiplex_stream_id].write_message(msg[0])

 
# Global Route
application = tornado.web.Application([
    (r'/ws', WSHandler),
])
 
 
# Start Main

if __name__ == "__main__":
 
    # Parse configuration
    tornado.options.parse_config_file("gissocket.config")
 
    # Start GeocodeWorker subprocess

    geocode_worker = geocodeworker.GeocodeWorker(options)
    geocode_worker.start()
    geocode_worker2 = geocodeworker.GeocodeWorker(options)
    geocode_worker2.start()
    geospatial_worker = geospatialworker.GeoSpatialWorker(options)
    geospatial_worker.start()

    # Init Communication Sockets
    # sock_push: Pushes websocket requests to workers
    # sock_pull: Gathers results from the workers

    ctx = zmq.Context.instance()
    sock_push_geocode = ctx.socket(zmq.PUSH)
    sock_push_geocode.bind(options.geocode_workurl)
    sockpush_geocode_stream = ZMQStream(sock_push_geocode)

    sock_push_spatial = ctx.socket(zmq.PUSH)
    sock_push_spatial.bind(options.geospatial_workurl)
    sockpush_spatial_stream = ZMQStream(sock_push_spatial)

    sock_pull = ctx.socket(zmq.PULL)
    sock_pull.bind(options.resulturl)
    sockpullstream = ZMQStream(sock_pull)
    sockpullstream.on_recv(handle_geocode_result)

    # Launch server
    http_server = tornado.httpserver.HTTPServer(application)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

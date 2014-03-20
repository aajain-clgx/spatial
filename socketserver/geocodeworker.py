import multiprocessing, time, os, sys
from pxpoint import pxpointsc, pxcommon, table  
from geospatialdefaults import *
import geospatiallib
import zmq

# ToDo
# Take all value and drive it via 

DEFAULT_LICENSE_FILE = r'pxpoint.lic'
LICENSE_KEY = 123456789
DATASET_ROOT = r'/mnt/data/PxPoint_2013_12'

class GeocodeWorker(multiprocessing.Process):

    def __init__(self, options):
        """Geocode Worker Initialization Routine"""
        multiprocessing.Process.__init__(self)
        self.options = options
      

    def init_geocoder(self):
        """Initialize Geoocder for PxPointSC"""
        (geocoder_handle, return_code, return_message) = pxpointsc.geocoder_init(
            self.options.dataset_root,
            ['NavteqStreet', 'Parcel', 'USPS'],
            self.options.licensefile,
            self.options.licensekey
        )
        if return_code != 0:
            raise RuntimeError('Code: {c}. Message: {m}'.format(c=return_code, m=return_message))
        return geocoder_handle, return_code, return_message

    def run(self):
        """ Geocode Worker run function 
            Only this function is run under the subprocess
            Hence, we create the sockets as well as initialize the geocoding library here
        """

        # Init Geocoder
        gh, rc, rm = self.init_geocoder()
        self.geocoder_handle = gh

        # Init ZMQ sockets
        self.context = zmq.Context()
        self.socket_pull = self.context.socket(zmq.PULL)
        self.socket_pull.connect(self.options.workurl)

        self.socket_push = self.context.socket(zmq.PUSH)
        self.socket_push.connect(self.options.resulturl)

        while True:

            msg = self.socket_pull.recv_json()
            
            # Poison pill to shutdown subprocess
            if msg['CityLine'] == '' and msg['AddressLine'] == '':
                print 'GeocodeWorker: Exiting' 
                break

            # Perform Geocode

            input_table = geospatiallib.create_geocode_input_table(msg['WebSocketId'], msg['AddressLine'], msg['CityLine'])

            (output_table, error_table, return_code, return_message) = pxpointsc.geocoder_geocode(
                self.geocoder_handle,
                input_table,
                GeoSpatialDefaults.GEOCODING_OUTPUT_COLS,
                GeoSpatialDefaults.ERROR_TABLE_COLS,
                GeoSpatialDefaults.BESTMATCH_FINDER_OPTIONS
            )

            # Create output JSON dictionary
            output = geospatiallib.create_json_result_with_status(output_table, error_table, return_code)
    
            # put this back on the pipe
            self.socket_push.send(output)


import multiprocessing
from pxpoint import pxpointsc
from geospatialdefaults import *  # NOQA
from pxpoint.util.datacatalog import *  # NOQA
import geospatiallib
import zmq


class GeocodeWorker(multiprocessing.Process):

    def __init__(self, options):
        """Geocode Worker Initialization Routine"""
        multiprocessing.Process.__init__(self)
        self.options = options

    def init_geocoder(self):
        """Initialize Geoocder for PxPointSC"""
        catalog = read_catalog_to_dict(
            self.options.datacatalog_path, self.options.pxse_dir)
        geocoder_handle,
        return_code,
        return_message = pxpointsc.geocoder_init_catalog(catalog)
        if return_code != 0:
            raise RuntimeError('Code: {c}. Message: {m}'.format(
                c=return_code, m=return_message))
        return geocoder_handle, return_code, return_message

    def run(self):
        """ Geocode Worker run function
            Only this function is run under the subprocess
            Hence, we create the sockets as well as initialize the geocoding
            library here
        """

        # Init Geocoder
        gh, rc, rm = self.init_geocoder()
        self.geocoder_handle = gh

        # Init ZMQ sockets
        self.context = zmq.Context()
        self.socket_pull = self.context.socket(zmq.PULL)
        self.socket_pull.connect(self.options.geocode_workurl)

        self.socket_push = self.context.socket(zmq.PUSH)
        self.socket_push.connect(self.options.resulturl)

        while True:

            msg = self.socket_pull.recv_json()

            input_table = geospatiallib.create_geocode_input_table(
                msg['WebSocketId'], msg['AddressLine'], msg['CityLine'])

            output_table,
            error_table,
            return_code,
            return_message = pxpointsc.geocoder_geocode(
                self.geocoder_handle,
                input_table,
                GeoSpatialDefaults.GEOCODING_OUTPUT_COLS,
                GeoSpatialDefaults.ERROR_TABLE_COLS,
                GeoSpatialDefaults.BESTMATCH_FINDER_OPTIONS)

            # Create output JSON dictionary
            output = geospatiallib.create_json_result_with_status(
                output_table, error_table, return_code)

            # put this back on the pipe
            self.socket_push.send(output)

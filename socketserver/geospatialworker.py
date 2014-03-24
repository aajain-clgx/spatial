import multiprocessing
from pxpoint import pxpointsc
from pxpoint.util.datalog import *  # NOQA
from geospatialdefaults import *  # NOQA
import geospatiallib
import zmq


class GeoSpatialWorker(multiprocessing.Process):

    def __init__(self, options):
        """Spatial Worker Initialization Routine"""
        multiprocessing.Process.__init__(self)
        self.options = options

    def init_spatial(self):
        """Initialize Spatial for PxPointSC"""
        catalog = read_catalog_to_dict(
            self.options.datacatalog_path, self.options.pxse_dir)
        spatial_handle,
        return_code,
        return_message = pxpointsc.geospatial_init_catalog(catalog)
        if return_code != 0:
            raise RuntimeError('Code: {c}. Message: {m}'.format(
                c=return_code, m=return_message))

        layer_alias_fields_map = pxpointsc.geospatial_prepare(
            spatial_handle, catalog, GeoSpatialDefaults.LAYER_ALIASES)

        return spatial_handle, layer_alias_fields_map

    def run(self):
        sh, layer_alias_fields_map = self.init_spatial()
        self.spatial_handle = sh

        # Init ZMQ sockets
        self.context = zmq.Context()
        self.socket_pull = self.context.socket(zmq.PULL)
        self.socket_pull.connect(self.options.geospatial_workurl)

        self.socket_push = self.context.socket(zmq.PUSH)
        self.socket_push.connect(self.options.resulturl)

        while True:

            msg = self.socket_pull.recv_json()

            input_table = geospatiallib.create_query_input_table(
                msg['WebSocketId'], msg['lat'], msg['lon'])

            output_columns = '[{a}]Input.Id;' + ';'.join(
                layer_alias_fields_map[msg['layer']])
            query_options = geospatiallib.create_query_options(msg['layer'])
            output_table,
            error_table,
            return_code,
            return_message = pxpointsc.geospatial_query(
                self.spatial_handle,
                input_table,
                output_columns,
                GeoSpatialDefaults.ERROR_TABLE_COLS,
                query_options)

            # Create output JSON dictionary
            output = geospatiallib.create_json_result_with_status(
                output_table, error_table, return_code)

            # put this back on the pipe
            self.socket_push.send(output)

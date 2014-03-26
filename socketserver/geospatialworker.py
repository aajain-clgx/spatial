import multiprocessing
from pxpoint import pxpointsc
from pxpoint.util.datacatalog import *  # NOQA
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
        spatial_handle, rc, msg = pxpointsc.geospatial_init_catalog(catalog)
        if rc != 0:
            raise RuntimeError('Code: {c}. Message: {m}'.format(
                c=rc, m=msg))

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

            in_tbl = geospatiallib.create_query_input_table(
                msg['WebSocketId'], msg['lat'], msg['lon'])

            out_cols = '[{a}]INPUT.Id;'.format(a=msg['layer']) + ';'.join(
                layer_alias_fields_map[msg['layer']])
            query_options = geospatiallib.create_query_options(msg['layer'])
            out_tbl, err_tbl, rc, msg = pxpointsc.geospatial_query(
                self.spatial_handle,
                 in_tbl,
                out_cols,
                GeoSpatialDefaults.get_query_error_columns(msg['layer']),
                query_options)

            # Create output JSON dictionary
            output = geospatiallib.create_json_result_with_status(out_tbl, err_tbl, rc)

            # put this back on the pipe
            self.socket_push.send(output)

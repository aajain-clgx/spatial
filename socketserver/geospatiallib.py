"""
  GeoSpatialLib module

  This library exposes common methods useds for creating the python GSERT
  geospatial engine.
"""

from pxpoint import table, pxcommon
import json
from geospatialdefaults import *  # NOQA


def create_geocode_input_table(call_id, address_line, city_line=None):
    """Create an input table with a single row."""
    input_table = table.Table()
    input_table.append_col(GeoSpatialDefaults.INPUT_ID_COL_NAME)
    input_table.append_col('$AddressLine')
    if city_line is None:
        input_table.append_row((call_id, address_line, ))
    else:
        input_table.append_col('$CityLine')
        input_table.append_row((str(call_id), address_line, city_line))
    return input_table


def create_query_input_table(call_id, lat, lon):
    """Create an input table with a single row."""
    geometry = pxcommon.get_wkt_point_from_dec_coords(lat, lon)
    input_table = table.Table()
    input_table.append_col(GeoSpatialDefaults.INPUT_ID_COL_NAME)
    input_table.append_col('InputGeometry')
    input_table.append_row((str(call_id), geometry))
    return input_table


def create_query_options(layer_alias, search_dist_meters=0):
    """Create GeoSpatial query options string (for pxpointsc)"""
    proc_opts = 'InputGeoColumn=InputGeometry'
    if search_dist_meters <= 0:
        proc_opts = ';'.join([proc_opts, '[{a}]{o}'.format(
            a=layer_alias, o=pxcommon.get_spatial_relation_spec(
                pxcommon.SpatialRelation.WITHIN))]
        )
    else:
        proc_opts = ';'.join([proc_opts, '[{a}]{o}'.format(
            a=layer_alias,
            o='FindNearest=T;[{a}]Distance={m}'.format(
                a=layer_alias, m=search_dist_meters))]
        )
    return proc_opts


def create_server_error_json_result(statuscode, message):
    """Creates a JSON string from a server error message."""
    return_obj = {}
    return_obj["result"] = []
    return_obj["status"] = statuscode
    return_obj["message"] = message
    return json.dumps(return_obj, sort_keys=True)


def create_json_result_with_status(
        socketid, out_tbl, err_tbl, rc, rm, max_results=-1):
    """Creates a JSON string from a PxPointSC result."""

    def sanitize_colname(colname):
        """Remove $ sign from col name if it exists"""
        return colname[1:] if colname[0] == '$' else colname

    return_obj = {}
    return_obj['socketid'] = socketid

    if rc == pxcommon.PXP_SUCCESS:
        # If there are rows in error table, mark status as error
        if(err_tbl is not None and err_tbl.nrows() > 0):
            errors = [
                {err_tbl.col_names[i]: str(err_tbl.rows[j][i]).encode("unicode_escape")
                    for i in xrange(err_tbl.ncols())}
                for j in xrange(err_tbl.nrows())
            ]
            return_obj["status"] = StatusCode.SERVER_ERROR
            return_obj["message"] = errors[0]['$ErrorMessage']
            return_obj["result"] = []
        else:
            o_nrows = 0 if out_tbl is None else out_tbl.nrows()
            if o_nrows == 0:
                return_obj["status"] = StatusCode.SERVER_ERROR
                return_obj["message"] = "Output table is empty, despite a successful operation"
                return_obj["result"] = []
            else:
                if max_results > o_nrows or max_results == -1:
                    max_results = o_nrows

                # Dictionary comprehension inside list comprehension
                result = [
                    {sanitize_colname(out_tbl.col_names[i]):
                        str(out_tbl.rows[j][i]).encode("unicode_escape")
                        for i in xrange(out_tbl.ncols())}
                    for j in xrange(max_results)
                ]

                # Get WebSocket routing information
                for row in result:
                    del row['INPUT.Id']

                return_obj["message"] = ""
                return_obj["status"] = StatusCode.OK
                return_obj["result"] = result
    else:
        if(pxcommon.PXP_INVALID_ARGUMENT):
            return_obj["status"] = StatusCode.INVALID_REQUEST
        else:
            return_obj["status"] = StatusCode.SERVER_ERROR
        return_obj["message"] = rm
        return_obj["result"] = []

    return json.dumps(return_obj, sort_keys=True)

if __name__ == "__main__":
    # Test Code
    DEFAULT_LICENSE_FILE = r'pxpoint.lic'
    LICENSE_KEY = 123456789
    DATASET_ROOT = r'//mnt/data/pxse-data/geocode/PxPoint_2013_12'
    from pxpoint import pxpointsc
    import pprint
    (geocoder_handle, rc, msg) = pxpointsc.geocoder_init(
        DATASET_ROOT,
        ['NavteqStreet', 'Parcel', 'USPS'],
        DEFAULT_LICENSE_FILE,
        LICENSE_KEY
    )
    input_table = create_geocode_input_table(
        4, '3239 Redstone Road', 'Boulder CO'
    )

    out_tbl, err_tbl, rc, msg = pxpointsc.geocoder_geocode(
        geocoder_handle,
        input_table,
        GeoSpatialDefaults.GEOCODING_OUTPUT_COLS,
        GeoSpatialDefaults.ERROR_TABLE_COLS,
        GeoSpatialDefaults.BESTMATCH_FINDER_OPTIONS
    )

    pprint.pprint(out_tbl)
    pprint.pprint(err_tbl)

    result = create_json_result_with_status(
        0, out_tbl, err_tbl, rc, msg
    )
    result_dict = json.loads(result)
    print result_dict["status"]

    pprint.pprint(result_dict)

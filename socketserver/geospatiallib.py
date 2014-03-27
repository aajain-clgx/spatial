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
        out_tbl, err_tbl, rc, max_results=-1):
    """Creates a JSON string from a PxPointSC result."""

    def sanitize_colname(colname):
        """Remove $ sign from col name if it exists"""
        return colname[1:] if colname[0] == '$' else colname

    result = []
    status = StatusCode.OK
    message = ""
    socketid = -1

    if rc == pxcommon.PXP_SUCCESS:
        o_nrows = 0 if out_tbl is None else out_tbl.nrows()
        if o_nrows == 0:
            status = StatusCode.SERVER_ERROR
            message = "Output table is empty, despite a successful geocode"
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

            socketid = result[0]['INPUT.Id']
            for row in result:
                del row['INPUT.Id']
    elif err_tbl is None or err_tbl.nrows == 0:
        status = StatusCode.SERVER_ERROR
        message = "Error table is empty, despite apparent error"
    else:
        errors = [
            {err_tbl.col_names[i]: str(err_tbl.rows[j][i]).encode("unicode_escape")
                for i in xrange(err_tbl.ncols())}
            for j in xrange(err_tbl.nrows())
        ]
        socketid = errors[0]['INPUT.Id']
        error_code = errors[0]['error_code']
        error_message = errors[0]['error_message']
        status = StatusCode.SERVER_ERROR
        if rc == pxcommon.PXP_INVALID_ARGUMENT:
            status = StatusCode.INVALID_REQUEST
        message = "Code: {c}. Message: {m}".format(
            c=error_code, m=error_message
        )

    return_obj = {}
    return_obj["result"] = result
    return_obj["status"] = status
    return_obj["message"] = message
    return_obj["socketid"] = socketid

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
        out_tbl, err_tbl, rc
    )
    result_dict = json.loads(result)
    print result_dict["status"]

    pprint.pprint(result_dict)

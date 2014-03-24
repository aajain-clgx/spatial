class GeoSpatialDefaults(object):
  """Constant class to hold default values used by GeoSpatial workers """

    INPUT_ID_COL_NAME = "Id"
    INPUT_GEOMETRY_COL_NAME = "InputGeometry"
    INPUT_ADDRESS_COL_NAME = "$Address"
    ERROR_TABLE_COLS = "$ErrorCode;$ErrorMessage"
    GEOCODING_OUTPUT_COLS = ";".join(
        [
            "INPUT.{col_id}".format(col_id=INPUT_ID_COL_NAME),
            "$AddressLine",
            "$City",
            "$CityLine",
            "$County",
            "$Dataset",
            "$ExtraFound",
            "$IsIntersection",
            "$Latitude",
            "$Longitude",
            "$MatchCode",
            "$MatchDescription",
            "$Number",
            "$Postcode",
            "$State",
            "$StreetAddress",
            "$StreetName",
            "$StreetSide",
            "$UnitNumber"
        ])
    BESTMATCH_FINDER_OPTIONS = 'BestResultOnly=True'
    LAYER_ALIASES =
        [
#            "Brushfire",
#            "CableTax",
            "Coastline",
#            "CombinedSewerArea",
            "Continent",
            "Country",
            "County",
#            "CrimeRisk",
#            "EarthquakeEpicenter",
#            "EarthquakeFault",
#            "EQRisk",
#            "Firebreak",
#            "FireResponseArea",
#            "FireStation",
#            "FireStationDrivingDistance",
#            "FloodMap",
#            "FloodRiskScoreLayer",
#            "HailProbability",
#            "LavaFlow",
#            "Mainland",
#            "Mining",
#            "Municipal",
#            "MunicipalDissolve",
#            "PayrollTax",
#            "PremiumTax",
#            "PropertyTaxGen",
#            "PropertyTaxReg",
#            "RentalTax",
#            "SalesUseTax",
#            "Sinkhole",
#            "SpecialTaxDistrict",
            "State",
#            "Surge",
#            "TelecommunicationTax",
#            "Tiger_Townships",
#            "Township",
#            "Tsunami",
#            "UtilityTax",
#            "WildfireHistory",
#            "WindBorneDebris",
#            "Windpool",
#            "WindProbability"
        ]


class StatusCode(object):
    """StatusCode returned by GeoSpatial Worker"""
    OK = "OK"
    NO_RESULTS = "NO_RESULTS"
    INVALID_REQUEST = "INVALID_REQUEST"
    SERVER_ERROR = "SERVER_ERROR"
  


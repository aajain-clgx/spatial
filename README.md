#spatial#

A simple spatial rest service.

So far, our api is limited to a single resource endpoint:

- https://api.gisportal.com/spatial

###Authentication###

All requests to our spatial API require authentication parameters, submitted 
in the query string appended to the URL.

Required parameters:

- `clientKey`: the requester's public key, used to retrieve the requester's 
private key
- `timestamp`: the time of the request, given in seconds since Epoch UTC
- `signature`: the signature created by creating a HMAC-SHA1 hash of a portion 
of the request URL

It is assumed throughout that resource requests contain authentication 
parameters.

###Realtime API###

Geocoding and spatial analysis of discrete locations is performed via our 
realtime API. Below is a summary of our realtime resources.

**Geocoding**. Get the location of an address:

<dl><dd><code>GET: /location?<em>parameters</em></code></dd></dl>

Required parameter:

- `address`: The address you want to locate. 

Sample response (JSON):

    {
      "results" : [
        {
          "addressLine" : "123 MAIN ST",
          "cityLine" : "ANYTOWN, CA 98453",
          "county" : "LOS ANGELES",
          "dataset" : "NAVTEQ",
          "latitude" : 0.00,
          "longitude" : 0.00,
          "matchCode" : "A0000",
          "streetNumber" : "123",
          "postalCode" : "98453",
          "state" : "CA",
          "streetName" : "MAIN",
          "streetNamePrefix" : "",
          "streetNameSuffix" : "ST",
          "streetNamePostDir" : "",
          "streetNamePreDir" : "",
          "streetSide" : "L"
        }
      ]
    }


**Layer description**. Get the names of the layers you may query, as well 
their field names and field types, or information about a single layer, 
specified by name:

<dl><dd><code>GET: /layerinfo</code></dd></dl>


<dl><dd><code>GET: /layerinfo/{layername}</code></dd></dl>

Sample response (JSON):

    {
      "layers" : [
        {
          "name" : "brushfire",
          "fields" : [
            {
              "name" : "ID",
              "type" : "numeric",
              "length" : 10,
              "description" : "Identifier"
            },
            {
              "name" : "RISK_VALUE",
              "type" : "numeric",
              "length" : 4,
              "description" : "Numeric Ranking of Brushfire Risk"
            },
            {
              "name" : "FIRE_RISK",
              "type" : "text",
              "length" : 25,
              "description" : "Nominal Description of Brushfire Risk"
            },
          ]
        },
        {
          "name" : "windbornedebris",
          "fields" : [
            {
              "name" : "WINDSPEED",
              "type" : "text",
              "length" : 15,
              "description" : "A Wind Speed Zone (in miles per hour)"
            },
            {
              "name" : "DEBRIS_REG",
              "type" : "text",
              "length" : 3,
              "description" : "A Wind-Borne Debris Region (Yes/No)"
            },
          ]
        }
      }

**Layer querying**. Get information from the specified layer based on the 
specified location:

<dl><dd><code>GET: /{layername}?<em>parameters</em></code></dd></dl> 

Required parameters are either:

- `lat`: the latitude of the location, in decimal degrees
- `lon`: the longitude of the location, in decimal degrees

or:

- `address`: an address from which a latitude and longitude can be derived

A request containing any mixture of these will be rejected.

If the request contains an address parameter, and the address cannot be found, 
a `NO_RESULTS` response will be returned.

Latitude and Longitude values are rounded to six decimal degrees of precision.

By default, the query returns all the layer features containing the specified 
location. But the query can also return features that do not contain the 
location, using the optional parameters below.

Optional parameters:

- `search-radius`: the radius, in meters, of the circle surrounding the 
location in which to search for layer features
- `max-results`: the maximum number of results to return
- `fields`: a comma-delimited list of field names, specifying those fields 
each returned feature should contain

Features are sorted by distance from the location, with the first one found
being coming first in case of ties. By default, all fields are returned.

For example, to find the feature nearest to a given location within 500 meters, 
one may set `search-radius` to `500` and `max-results` to `1`.

###Batch API###

Geocoding and spatial analysis of locations in batch is performed via our
batch API. It supports the following resources:


spatial
=======

A simple spatial rest service.

So far, our api is limited to a single resource endpoint:

- https://api.gisportal.com/spatial

Our resources are as follows:

Geocoding
---------

**GET: /location?_parameters_**
Returns the geocoded location of a supplied address.
> Acceptable _parameters_:
>- "address": A string containing a complete address, understood as a string 
containing a '+'-delimited string of URI unreserved characters, such as 
"123+Main+St.,+AnyTown,+CA".
>- "addressline": A string containing the street identifying portion of an 
address, such as "123+Main+St" from the "address" example.
>- "cityline": A string containing the city-and-state identifying portion of 
an address, such as "AnyTown,+CA" from the "address" example.

Spatial Analysis
----------------

**GET: /layers**

Returns a full description of the layers that may be queried through this 
service. Each layer description has the following properties:
>- "name": The name of the layer, used in querying the service.
>- "fields": A list of descriptions of fields available for layer queries. Each
field description has the following properties:
>>- "name": The name of the field.
>>- "type": The field type (e.g., numeric, character).
>>- "desc": A brief description of what sort of information the field contains.

**GET: /:layername?_parameters_**
Returns information about a location from the specified layer. The layername 
may be any of the layer names exposed through the service, retrievable by 
using the **/layers** resource.
> Acceptable _parameters_:
>- "lat": A latitude expressed in decimal degrees, such as 33.11422.
>- "lon": A longitude expressed in decimal degrees, such as -102.9433.
>- "address", or both "addressline" and "cityline"

# Vehicle Selection Modal
This script allows you to quickly implement RideStyler vehicle selection modal into your website. Simply include the script and initialize it. The script will take care of the rest.
**Note:** This widget requires that the RideStyler API script be included in your website as well as it is used for communicating with the API.
# Getting Started
All of the RideStyler Widgets are designed to be as easy as possible to add to your website. Simply follow the step-by-step instructions outlined below.
## Add Script References
The first step is simply adding a reference to the RideStyler JavaScript API and the Vehicle Selection Modal script and stylesheet files.
```
<script src="http://api-alpha.ridestyler.net/js?DataType=json"></script>
<script src="rsvsm.js"></script>
<link rel="stylesheet" type="text/css" href="rsvsm.css">
```
## Initialize the Widget
Next we need to initialize the API and our Vehicle Selection Modal widget.

First, we will initialize the JavaScript API using our API key
```
ridestyler.initialize({ Key: 'c028c54cf0c447c594a862de6ac85d1a' });
```

Next, we initialize the Vehicle Selection Modal.
```
var rsvsm = new RideStylerVehicleSelectionModal();
```

Next, we call out the Vehicle Selection Modal.
```
rsvsm.Show();
```

## Enjoy
That's it! You are ready to start picking vehicles on your website.

# Documentation
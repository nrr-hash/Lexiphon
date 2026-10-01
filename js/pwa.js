/* Registers the service worker on http and https only. */
if("serviceWorker" in navigator && /^https?:$/.test(location.protocol)){ window.addEventListener("load", function(){ navigator.serviceWorker.register("sw.js", {updateViaCache:"none"}).catch(function(){}); }); }

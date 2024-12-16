// I have used the project structure where project3 is the parent folder which consists yelp.html, proxy.php, yelp.js as child files.
// This way - project3 --> proxy.php yelp.html yelp.js. I have placed the project3 folder under the XAMPP --> htdocs --> project3 folder to test it.
// You can access my project at - http://localhost/project3/yelp.html

let map;
let longitude;
let latitude;
let radius;
let markers = []

async function initialize() {
   const { Map } = await google.maps.importLibrary("maps");
   map = new Map(document.getElementById("map"), {
      center: { lat: 32.75, lng: -97.13 },
      zoom: 16,
   });
   map.addListener('bounds_changed', function () {
      const bounds = map.getBounds()
      const center = map.getCenter()

      if (bounds) {
         // fetch northeast and southwest bounds to calculate center latitude,longitude 
         const neBounds = bounds.getNorthEast();
         const swBounds = bounds.getSouthWest();

         latitude = (swBounds.lat() + neBounds.lat()) / 2
         longitude = (swBounds.lng() + neBounds.lng()) / 2

         // calculate radius to fetch results within the map radius
         radius = Math.round(google.maps.geometry.spherical.computeDistanceBetween(center, neBounds))
      }
   })
}
// load map
window.initMap = initialize;

function findRestaurants() {
   let windowOpen = false;
   let currWindow = new google.maps.InfoWindow({})
   // set current markers to null whenever new search is performed
   markers.forEach(marker => marker.setMap(null));
   var xhr = new XMLHttpRequest();
   // fetch searchterm, city from the html
   var searchTerm = document.getElementById("searchTerm").value;
   var level = document.getElementById("level");
   // construct API call - latitude,longitude and radius included
   var url = "http://localhost/project3/proxy.php?term=" + encodeURIComponent(searchTerm) + "&latitude=" + encodeURIComponent(latitude) +
      "&longitude=" + encodeURIComponent(longitude) + "&radius=" + encodeURIComponent(radius) + "&limit=" + encodeURIComponent(level.value);
   xhr.open("GET", url, true);
   xhr.setRequestHeader("Accept", "application/json");
   xhr.onreadystatechange = function () {
      if (this.readyState == 4) {
         try {
            var json = JSON.parse(this.responseText);
            // show results if the json displays any response
            if (json.businesses.length > 0) {
               for (let i in json.businesses) {
                  elem = json.businesses[i] // fetch the element
                  const lat = parseFloat(elem.coordinates.latitude);
                  const lng = parseFloat(elem.coordinates.longitude);
                  try {
                     // creating markers on the map, displaying the order
                     const marker = new google.maps.Marker({
                        map: map,
                        position: { lat: lat, lng: lng },
                        label: {
                           text: (parseInt(i) + 1).toString(),
                           color: "white",
                           fontSize: "16px",
                           fontWeight: "bold"
                        },
                     })
                     // store marker in markers
                     markers.push(marker)
                     // info window for each marker containing info about restaurant
                     const infoWindow = new google.maps.InfoWindow({
                        content: `
                               <div style="text-align: center;margin-top:-10px">
                                   <h3>${elem.name}</h3>
                                   <img src="${elem.image_url}" alt="${elem.name}" style="width: 100px; height: auto;">
                                   <p>Rating: ${elem.rating} / 5</p>
                               </div>
                           `
                     });
                     // eventlistener on clicking close on info window
                     infoWindow.addListener('closeclick', () => {
                        windowOpen = false
                        infoWindow.close();
                     })
                     // eventlistener on clicking the info window
                     marker.addListener("click", function () {
                        if (!windowOpen && currWindow != infoWindow) {
                           currWindow.close();
                           infoWindow.open(map, marker)
                           currWindow = infoWindow
                           windowOpen = true
                        } else {
                           windowOpen = false
                           infoWindow.close();
                        }
                     });
                  } catch (e) {
                     console.log(e)
                  }
               }
            }
         } catch (e) {
            console.log(e)
         }
      }
   };
   xhr.send(null);
}

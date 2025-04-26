<script>
    import mapboxgl from 'mapbox-gl';
    import 'mapbox-gl/dist/mapbox-gl.css';
    import { onMount } from 'svelte';
    import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
    import Papa from 'papaparse';
    import redliningData from '/src/data/redlining_all_boroughs.json';
    import driData from '/src/data/nta_dri_merged.json';
    import dacData from '/src/data/ejnyc_areas_wgs84.json';
    import * as turf from '@turf/turf';


  
    let address = "";
    let mapContainer;
    let map;
    // let theme = 'light';
    let userMarker = null;
    let nycZipCodes = new Set();
    let zipError = "";
    let stylesLoaded = true;
    let ejnycOpacity = 0.2;
    let selectedEJArea = null;
    let ejnycPopup = null;



    // Store initial view for reset
    let initialView = {
      center: [-73.9, 40.7128],
      zoom: 10,
      pitch: 0,
      bearing: 0
    };

    let userAddress=null;

    // Function to reset map view
    function resetMapView() {
      if (map) {
        map.flyTo({
          center: initialView.center,
          zoom: initialView.zoom,
          pitch: initialView.pitch,
          bearing: initialView.bearing,
          duration: 1000
        });
      }
    }

    function closeEJNYCInfo() {
      selectedEJArea = null;
    }

    async function geocodeAddress(query) {
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${PUBLIC_MAPBOX_TOKEN}`;

        try {
            const res = await fetch(endpoint);
            const data = await res.json();

            if (data.features && data.features.length > 0) {
            return data.features[0]; // ✅ return the full feature
            } else {
            throw new Error("No results found");
            }
        } catch (err) {
            console.error("Geocoding error:", err);
            return null;
        }
    }


    // function toggleTheme() {
    //     theme = theme === 'dark' ? 'light' : 'dark';
    // }

    // New: list of all story steps including the search bar
    let cards = [
      {
          sectionId: "ejnyc",
          type: "intro",
          label: "What is EJNYC?",
          title: "What is EJNYC?",
          mapView: {
            center: initialView.center, // NYC default view
            zoom: initialView.zoom
          },
          content: `
            <p>New York City's 2024 <i>EJNYC Report</i> highlights places in New York City where people face more pollution, climate risks, or other environmental issues—<strong>especially in neighborhoods already dealing with social or economic challenges</strong>.</p>

            <p>These places are called <strong>Environmental Justice (EJ) Areas</strong>, and have:</p>

            <ul>
              <li>at least one <em>environmental problem</em> (like poor air quality, flooding, or not enough green space)</li>
              <li>at least one <em>social vulnerability</em> (like high poverty or many people with limited English)</li>
            </ul>

            <p>NYC uses this report to help make fairer decisions about health, planning, and climate action.</p>

            <p><a href="https://climate.cityofnewyork.us/topic/environmental-justice/" target="_blank">Read the full EJNYC report (PDF)</a></p>
          `
        },
        {
          sectionId: "ejnyc",
          type: "subsection",
          label: "What are DACs?",
          title: "What Are Disadvantaged Communities (DACs)?",
          mapView: {
            center: [-75.3, 42.8], // New York State view
            zoom: 6.1
          },
          content: `
            <p>EJ Areas are based on New York State's <strong>Disadvantaged Community (DAC)</strong> designation—places that are at greater risk from pollution or climate change <i>and</i> also face health or social burdens.</p>

            <p>This comes from the <strong>CLCPA law</strong>, which says at least 35% of state climate funding must go to DACs.</p>

            <p>DACs are chosen using 45 data points, grouped into:</p>
            <ul>
              <li><strong>Environmental burdens</strong> (like toxic sites or air pollution)</li>
              <li><strong>Health and population factors</strong> (like high asthma rates or low incomes)</li>
            </ul>

            <p><a href="https://climate.ny.gov/Resources/Climate-Justice-Working-Group" target="_blank">Learn more about DACs on NY State's climate site</a></p>

            <p>The map shows DACs across all of New York State. Next, we'll zoom back in on the city.</p>
              `
        },
        {
          sectionId: "ejnyc",
          type: "subsection",
          label: "What are EJ Areas?",
          title: "Zooming into NYC: Environmental Justice Areas",
          mapView: {
            center: initialView.center, // NYC default view
            zoom: initialView.zoom
          },
          content: `
            <p>NYC's <strong>EJ Areas</strong> cover around 44% of the city's census tracts, containing about 49% of its population.</p>
            <p><i>Adjust the slider in the top left corner to show/hide EJ Areas</i></p>

            <p>The city government uses this to guide:</p>
            <ul>
              <li>Where to invest in climate upgrades</li>
              <li>Where to improve green space or housing</li>
              <li>Where to focus public health programs</li>
            </ul>

            <p>This project explores various aspects of that report by pulling together data from city and state agencies, historical sources, and many others to help you, as a New York City resident, understand the ways that climate and environemtnal factors affect your area—and what might be done to mitigate them.</p>
            `
        },
        {
          sectionId: "ejnyc",
          type: "subsection",
          label: "Navigation Overview",
          title: "What's Covered in The EJNYC Report?",
          content: `
            <p>The EJNYC report is organized into six key focus areas that reflect how environmental and health risks affect different communities across NYC. Each section explores a specific category, helping users understand environmental injustice throughout the city. These categories are:</p>
            <table class="section-table">
              <tr>
                <td class="icon-cell section-resources">
                  <!-- Resources Icon -->
                  <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 159.64 216.07">
                    <defs>
                      <style>
                        .cls-1 {
                          fill:currentColor;
                        }
                      </style>
                    </defs>
                    <g id="Layer_1-2" data-name="Layer 1">
                      <path class="cls-1" d="M158.82,178l-25.31-39.31c-2.19-3.4.25-7.88,4.3-7.88h8.26c4.16,0,6.58-4.7,4.16-8.08l-26.54-37.18c-2.42-3.38,0-8.08,4.16-8.08h0c4.16,0,6.58-4.7,4.16-8.08L83.98,2.14c-2.04-2.86-6.28-2.86-8.32,0L27.64,69.39c-2.42,3.38,0,8.08,4.16,8.08h0c4.16,0,6.58,4.7,4.16,8.08l-26.54,37.18c-2.42,3.38,0,8.08,4.16,8.08h8.26c4.05,0,6.49,4.48,4.3,7.88L.82,178c-2.19,3.4.25,7.88,4.3,7.88h45.56c2.82,0,5.11,2.29,5.11,5.11v19.97c0,2.82,2.29,5.11,5.11,5.11h37.82c2.82,0,5.11-2.29,5.11-5.11v-19.97c0-2.82,2.29-5.11,5.11-5.11h45.56c4.05,0,6.49-4.48,4.3-7.88Z"/>
                    </g>
                  </svg>
                </td>
                <td class="text-cell"><p><strong>Access to Resources:</strong><br> Measures how easily communities can reach parks, schools, supermarkets, and healthcare. It highlights inequities in the basic infrastructure needed to live a healthy life.</p></td>
              </tr>

              <tr>
                <td class="icon-cell section-air">
                  <!-- Air Icon -->
                  <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 199.78 216">
                    <defs>
                      <style>
                        .cls-1 {
                          fill:currentColor;
                        }
                      </style>
                    </defs>
                    <g id="Layer_1-2" data-name="Layer 1">
                      <g>
                        <path fill=currentColor d="M193.48,142.74l-34.84-21.63c-2.02-1.25-4.44-1.69-6.77-1.23l-83.11,16.62c-5.53,1.11-10.78-2.9-11.17-8.53l-3.03-43.71c-.34-4.91-4.42-8.71-9.34-8.71s-8.91,3.72-9.32,8.56l-4.8,55.7c-.25,2.94-1.88,5.59-4.39,7.15l-22.29,13.83c-2.75,1.71-4.42,4.71-4.42,7.95v37.9c0,5.17,4.19,9.36,9.36,9.36h179.19c5.17,0,9.36-4.19,9.36-9.36v-55.95c0-3.24-1.67-6.24-4.42-7.95Z"/>
                        <path fill=currentColor d="M46.05,71.15c3.48.43,6.66-.65,9.02-2.64,1.58-1.33,3.86-1.52,5.71-.59.28.14.56.27.85.4,1.3.56,2.34,1.58,2.85,2.91,3.24,8.42,10.88,14.55,19.95,15.76,2.38.32,4.1,2.38,4.25,4.78,0,.02,0,.03,0,.05.84,12.78,11.87,22.47,24.66,21.63,5.14-.34,9.77-2.33,13.42-5.41,1.74-1.48,4.28-1.53,6.14-.19,3.49,2.52,7.86,3.88,12.49,3.58,8.57-.56,15.47-6.67,17.42-14.59.41-1.68,1.72-3.02,3.38-3.48,9.68-2.72,16.47-11.92,15.78-22.37-.18-2.69-.84-5.24-1.89-7.56-1.14-2.51.05-5.42,2.54-6.59,11.7-5.49,19.09-18.31,16.69-32.19C196.93,10.75,184.76.3,170.67,0c-8.5-.18-16.11,3.13-21.61,8.52-1.83,1.8-4.76,1.84-6.71.18-4.68-4-10.87-6.25-17.51-5.81-7.55.49-14.08,4.37-18.21,10.05-1.16,1.6-3.15,2.39-5.08,1.98-2.18-.46-4.46-.63-6.79-.48-10.9.71-19.7,8.31-22.44,18.27-.6,2.19-2.49,3.74-4.76,3.83-.16,0-.31.01-.47.02-5.9.39-10.88,3.82-13.5,8.68-.97,1.79-2.89,2.94-4.91,2.75-.61-.06-1.23-.07-1.86-.03-7.17.47-12.41,7.35-10.49,14.69,1.18,4.5,5.1,7.92,9.72,8.49Z"/>
                      </g>
                    </g>
                  </svg>
                </td>
                <td class="text-cell"><p><strong>Exposure to Polluted Air:</strong><br> Identifies areas with higher levels of fine particulate matter (PM2.5) and asthma-related ER visits. It shows where air pollution most harms public health.</p></td>
              </tr>

              <tr>
                <td class="icon-cell section-hazards">
                  <!-- Hazard Icon -->
                  <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 216 190.2">
                    <defs>
                      <style>
                        .cls-1 {
                          fill:currentColor;
                        }
                      </style>
                    </defs>
                    <g id="Layer_1-2" data-name="Layer 1">
                      <path fill=currentColor d="M214.4,172.45L118.25,5.92c-4.55-7.89-15.94-7.89-20.49,0L1.6,172.45c-4.55,7.89,1.14,17.75,10.25,17.75h192.3c9.11,0,14.8-9.86,10.25-17.75ZM102.83,46.51h10.32c4.51,0,8.12,3.73,7.97,8.24l-2.33,69.97c-.14,4.3-3.67,7.71-7.97,7.71h-5.81c-4.31,0-7.84-3.42-7.97-7.73l-2.18-69.97c-.14-4.5,3.47-8.22,7.97-8.22ZM123.36,163.57c0,4.4-3.57,7.97-7.97,7.97h-14.78c-4.4,0-7.97-3.57-7.97-7.97v-12.63c0-4.4,3.57-7.97,7.97-7.97h14.78c4.4,0,7.97,3.57,7.97,7.97v12.63Z"/>
                    </g>
                  </svg>
                </td>
                <td class="text-cell"><p><strong>Exposure to Hazardous Materials:</strong><br> Tracks proximity to brownfields, waste transfer stations, and cleanup sites. It highlights how industrial hazards are concentrated in vulnerable areas.</p></td>
              </tr>

              <tr>
                <td class="icon-cell section-housing">
                  <!-- Housing Icon -->
                  <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 216 218.19">
                    <defs>
                      <style>
                        .cls-1 {
                          fill:currentColor;
                        }
                      </style>
                    </defs>
                    <g id="Layer_1-2" data-name="Layer 1">
                      <path fill=currentColor d="M147.66,39.87V6c0-3.31-2.68-6-6-6h-55.1c-3.31,0-6,2.68-6,6v131.24c0,1.77-1.44,3.21-3.21,3.21h-1.89c-1.77,0-3.21-1.44-3.21-3.21v-56.91c0-1.77-1.44-3.21-3.21-3.21h-.71c-1.77,0-3.21-1.44-3.21-3.21v-.63c0-1.77-1.44-3.21-3.21-3.21h-1.11c-1.77,0-3.21-1.44-3.21-3.21v-.63c0-1.77-1.44-3.21-3.21-3.21h-.63c-1.77,0-3.21-1.44-3.21-3.21v-.63c0-1.77-1.44-3.21-3.21-3.21h0c-1.77,0-3.21-1.44-3.21-3.21v-.63c0-1.77-1.44-3.21-3.21-3.21h-9.57c-1.77,0-3.21,1.44-3.21,3.21v.63c0,1.77-1.44,3.21-3.21,3.21h0c-1.77,0-3.21,1.44-3.21,3.21v.63c0,1.77-1.44,3.21-3.21,3.21h-.63c-1.77,0-3.21,1.44-3.21,3.21v.63c0,1.77-1.44,3.21-3.21,3.21h-1.11c-1.77,0-3.21,1.44-3.21,3.21v.63c0,1.77-1.44,3.21-3.21,3.21h-.71c-1.77,0-3.21,1.44-3.21,3.21v131.87c0,3.31,2.68,6,6,6h204.01c3.31,0,6-2.68,6-6V19.72c0-4.49-4.75-7.39-8.75-5.33l-54.92,28.34c-2.14,1.1-4.68-.45-4.68-2.85Z"/>
                    </g>
                  </svg>
                </td>
                <td class="text-cell"><p><strong>Access to Safe and Healthy Housing:</strong><br> Evaluates housing risks like overcrowding, pests, and maintenance issues. This section focuses on how poor housing conditions affect health and stability.</p></td>
              </tr>

              <tr>
                <td class="icon-cell section-water">
                  <!-- Water Icon -->
                  <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 214.27 142.94">
                    <defs>
                      <style>
                        .cls-1 {
                          fill:currentColor;
                        }
                      </style>
                    </defs>
                    <g id="Layer_1-2" data-name="Layer 1">
                      <g>
                        <path fill=currentColor d="M200.73,81.93c-12.28-15.46-28.32-20.1-36.79-21.49-.29-.05-.57-.07-.84-.07h-10.89c-1.96,0-3.67,1.04-4.7,2.86-1.17,2.08-1.13,4.65.11,6.7l.09.16c5.89,9.8,14.33,31.29,4.59,64.88-.58,1.99-.2,4.15,1.01,5.76,1.06,1.41,2.62,2.21,4.28,2.21h49.99c2.68,0,4.98-2.09,5.47-4.97,2.11-12.48,3.32-36.36-12.32-56.05Z"/>
                        <path fill=currentColor d="M148.68,83.79c-.89-2.7-2.17-5.27-3.87-7.55-5.22-7.02-8.59-18.01-8.59-30.36,0-21.2,9.9-38.39,22.12-38.39s22.12,17.19,22.12,38.39c0,4.08-.37,8.01-1.05,11.7-.23,1.27.44,2.52,1.62,3.05l.05.02c1.7.77,3.7-.25,4.03-2.09.74-4.08,1.13-8.39,1.13-12.86,0-25.24-12.57-45.71-28.07-45.71H28.07C12.57,0,0,20.46,0,45.71s12.57,45.71,28.07,45.71h119c1.85,0,3.24-1.74,2.79-3.53-.34-1.37-.74-2.74-1.18-4.1Z"/>
                      </g>
                    </g>
                  </svg>
                </td>
                <td class="text-cell"><p><strong>Exposure to Polluted Water:</strong><br> Examines risks from sewer backups, outdated infrastructure, and combined sewer overflows. It highlights neighborhoods most impacted by water-related issues.</p></td>
              </tr>

              <tr>
                <td class="icon-cell section-climate">
                  <!-- Climate Icon -->
                  <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 214.18 201.7">
                    <defs>
                      <style>
                        .cls-1 {
                          fill:currentColor;
                        }
                      </style>
                    </defs>
                    <g id="Layer_1-2" data-name="Layer 1">
                      <g>
                        <path fill=currentColor d="M22,39.84c25.73-8.58,54.08-8.58,79.8,0l.74.25c16.04,5.34,32.88,8.02,49.73,8.02,16.85,0,33.7-2.67,49.74-8.02l.74-.25c8.75-2.92,13.48-12.39,10.56-21.14-2.92-8.75-12.38-13.48-21.14-10.56l-.73.24c-25.26,8.42-53.08,8.42-78.33,0l-.74-.25C79.83-2.71,43.98-2.71,11.43,8.14,2.68,11.06-2.06,20.52.86,29.27c2.92,8.76,12.38,13.49,21.14,10.57Z"/>
                        <path fill=currentColor d="M192.18,84.94l-.73.24c-25.26,8.42-53.08,8.42-78.33,0l-.74-.25c-32.55-10.85-68.4-10.85-100.95,0-8.76,2.92-13.49,12.38-10.57,21.14,2.92,8.76,12.38,13.49,21.14,10.57,25.73-8.58,54.08-8.58,79.8,0l.74.25c16.04,5.34,32.88,8.02,49.73,8.02s33.7-2.67,49.74-8.02l.74-.25c8.75-2.92,13.48-12.39,10.56-21.14-2.92-8.75-12.38-13.48-21.14-10.56Z"/>
                        <path fill=currentColor d="M192.18,161.74l-.73.24c-25.26,8.42-53.08,8.42-78.33,0l-.74-.25c-32.55-10.85-68.4-10.85-100.95,0-8.76,2.92-13.49,12.38-10.57,21.14,2.92,8.75,12.38,13.49,21.14,10.57,25.73-8.58,54.08-8.58,79.8,0l.74.25c16.04,5.34,32.88,8.02,49.73,8.02s33.7-2.67,49.74-8.02l.74-.25c8.75-2.92,13.48-12.39,10.56-21.14-2.92-8.75-12.38-13.48-21.14-10.56Z"/>
                      </g>
                    </g>
                  </svg>
                </td>
                <td class="text-cell"><p><strong>Exposure to Climate Change:</strong><br> Focuses on neighborhoods at risk from heat waves, flooding, and sea level rise. It connects environmental threats to long-term community vulnerability.</p></td>
              </tr>
            </table>

            <hr style="margin: 1rem 0;" />

            <p><strong>Map Controls:</strong> Use the compass to rotate the map, the + and - buttons to zoom, and click the ↺ icon to reset the view to see the entire city.</p>
          `
        },
        { type: "search" },

        // Access to Resources
        {
            sectionId: "resources",
            type: "intro",
            label: "Access to Resources",
            title: "Access to Resources",
            content: `
              <p><strong>Access to Resources</strong> means having nearby parks, safe transit, healthy food, and investment in your community—all essentials for health and opportunity. In many neighborhoods, especially Environmental Justice Areas, these resources are harder to reach.</p>

              <p>This section explores how access is shaped by:<p>
              <ul>

                <li>Historical policies like redlining</li>
                <li>Public infrastructure investments (or lack of them)</li>
                <li>Availability of food, transit, and green space today</li>

              </ul>
              <p>Using historical maps, planning data, and resident insights, we connect past patterns of disinvestment to today's environmental challenges.</p>
              <p>Understanding these patterns helps reveal where barriers still exist—and where change is most needed.</p>
            `
        },
        {
            sectionId: "resources",
            type: "subsection",
            label: "Redlining",
            title: "Redlining: Mapping Disinvestment and Perpetuating Inequality",
            content: `
              <p>In the 1930s, the federal Home Owners' Loan Corporation (HOLC) created “residential security” maps to guide mortgage lending. Neighborhoods were graded in the following manner:<p>
                <ul>
                  <span style="color:#57f287"><strong>A</strong></span> — "Best"<br>
                  <span style="color:#3498db"><strong>B</strong></span> — "Still Desireable"<br>
                  <span style="color:#f1c40f"><strong>C</strong></span> — "Definitely Declining"<br>
                  <span style="color:#e74c3c"><strong>D</strong></span> — "Hazardous"
                </ul>
            <p>Areas with high Black, immigrant, and low-income populations were systematically given D grades—marked in red—restricting their access to home loans and public investment.</p>
            <p>The legacy of redlining persists today, shaping patterns of wealth, housing conditions, and access to resources. Many of New York City's Environmental Justice Areas overlap with historically redlined neighborhoods.</p>
            <p><strong>Your area received a __ rating. Adjust the EJNYC overlay to explore how these factors might overlap.</strong></p>
            
            <p><span style="font-size:12px;"><i>Redlining data provided by the <a href="https://dsl.richmond.edu/panorama/redlining/" target="_blank">Mapping Inequality Project</a> (University of Richmond, CC BY-NC 2.5 License).</i></span><p>
            `
        },
        {
            sectionId: "resources",
            type: "subsection",
            label: "Subsection 2",
            title: "Subsection 2",
            content: "Placeholder content for Subsection 2.",
        },

        // Exposure to Polluted Air
        {
            sectionId: "air",
            type: "intro",
            label: "Exposure to Polluted Air",
            title: "Exposure to Polluted Air",
            content: "Intro content for Exposure to Polluted Air.",
        },
        {
            sectionId: "air",
            type: "subsection",
            label: "Subsection 1",
            title: "Subsection 1",
            content: "Placeholder content for Subsection 1."
        },
        {
            sectionId: "air",
            type: "subsection",
            label: "Subsection 2",
            title: "Subsection 2",
            content: "Placeholder content for Subsection 2.",
            mapView: { center: [-74.00, 40.73], zoom: 12.5 },
        },

        // Exposure to Hazardous Materials
        {
            sectionId: "hazards",
            type: "intro",
            label: "Exposure to Hazardous Materials",
            title: "Exposure to Hazardous Materials",
            content: "Intro content for hazardous materials exposure."
        },
        {
            sectionId: "hazards",
            type: "subsection",
            label: "Subsection 1",
            title: "Subsection 1",
            content: "Placeholder content for Subsection 1."
        },
        {
            sectionId: "hazards",
            type: "subsection",
            label: "Subsection 2",
            title: "Subsection 2",
            content: "Placeholder content for Subsection 2.",
            mapView: { center: [-73.96, 40.76], zoom: 11.5 }
        },

        // Access to Safe and Healthy Housing
        {
            sectionId: "housing",
            type: "intro",
            label: "Access to Safe and Healthy Housing",
            title: "Access to Safe and Healthy Housing",
            content: "Intro content for housing access and safety."
        },
        {
            sectionId: "housing",
            type: "subsection",
            label: "Subsection 1",
            title: "Subsection 1",
            content: "Placeholder content for Subsection 1.",
            mapView: { center: [-73.99, 40.71], zoom: 13 }
        },
        {
            sectionId: "housing",
            type: "subsection",
            label: "Subsection 2",
            title: "Subsection 2",
            content: "Placeholder content for Subsection 2."
        },

        // Exposure to Polluted Water
        {
            sectionId: "water",
            type: "intro",
            label: "Exposure to Polluted Water",
            title: "Exposure to Polluted Water",
            content: "Intro content for polluted water exposure."
        },
        {
            sectionId: "water",
            type: "subsection",
            label: "Subsection 1",
            title: "Subsection 1",
            content: "Placeholder content for Subsection 1."
        },
        {
            sectionId: "water",
            type: "subsection",
            label: "Subsection 2",
            title: "Subsection 2",
            content: "Placeholder content for Subsection 2."
        },

        // Exposure to Climate Change
        {
            sectionId: "climate",
            type: "intro",
            label: "Exposure to Climate Change",
            title: "Exposure to Climate Change",
            content: "Intro content for climate change vulnerability."
        },
        {
            sectionId: "climate",
            type: "subsection",
            label: "Subsection 1",
            title: "Subsection 1",
            content: "Placeholder content for Subsection 1.",
            mapView: { center: [-73.92, 40.77], zoom: 12 }
        },
        {
            sectionId: "climate",
            type: "subsection",
            label: "Subsection 2",
            title: "Subsection 2",
            content: "Placeholder content for Subsection 2."
        }
    ];

        // Group cards by sectionId (excluding "search")
    let navSections = [];

        cards.forEach((card, index) => {
            if (card.type === 'intro' && card.sectionId !== 'ejnyc') {
                const section = {
                    sectionId: card.sectionId,
                    iconIndex: index,
                    label: card.label,
                    items: [{ label: card.label, index }] // intro
                };

                // Add subsections for this section
                cards.forEach((sub, i) => {
                    if (sub.sectionId === card.sectionId && sub.type === 'subsection') {
                        section.items.push({ label: sub.label, index: i });
                    }
                });

                navSections.push(section);
        }
    });



    let mapViews = [
        { center: [-74.006, 40.7128], zoom: 10 }, // search
        { center: [-73.95, 40.75], zoom: 12 }, // Access to Resources
        { center: [-73.98, 40.74], zoom: 13 }, // Exposure to Polluted Air
        { center: [-74.00, 40.73], zoom: 12.5 }, // Hazardous Materials
        { center: [-73.96, 40.76], zoom: 11.5 }, // Safe Housing
        { center: [-73.99, 40.71], zoom: 13 }, // Polluted Water
        { center: [-73.92, 40.77], zoom: 12 } // Climate Change
    ];

    let currentCardIndex = 0;

        // New: tracks which card is in view
    function observeCard(node, index) {
        const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
            currentCardIndex = index;
            console.log("Current card index:", index);
            }
        },
        { threshold: 0.5 }
        );

        observer.observe(node);

        return {
        destroy() {
            observer.unobserve(node);
        }
        };
    }
    
    const handleSubmit = async () => {
        console.log("Submitted address:", address);
        let location = await geocodeAddress(address);
        
        console.log("Full geocode result:", location);

        if (!location) {
            zipError = "Could not find that address.";
            return;
        }

        let zipFeature = location.context?.find(c => c.id.startsWith("postcode"));
        let zipCode = zipFeature?.text;

        console.log("Extracted ZIP:", zipCode);

        if (!nycZipCodes.has(zipCode)) {
            console.warn(`Initial result (${location.place_name}) not in NYC, retrying...`);

            // Try again, forcing New York
            const forcedQuery = `${address}, New York`;
            location = await geocodeAddress(forcedQuery);

            // Recheck ZIP
            zipFeature = location.context?.find(c => c.id.startsWith("postcode"));
            zipCode = zipFeature?.text;

            if (!nycZipCodes.has(zipCode)) {
                zipError = "Please enter an address within the 5 boroughs.";
                return;
            }
        } else {
            zipError = ""; // clear any previous error
        }

        let [lng, lat] = location.center;

        console.log("Final ZIP:", zipCode);
        console.log("Used corrected location:", location.place_name);

        userAddress = {
             center: [lng, lat],
             zoom: 13,
             pitch: 0,
             bearing: 0
         };

        if (location && map) {
            // map.flyTo({
            // center: [lng, lat],
            // zoom: 13,
            // essential: true
            // });
            if (userMarker) userMarker.remove(); // remove previous if any

            userMarker = new mapboxgl.Marker()
                .setLngLat([lng, lat])
                .addTo(map);


            console.log("Geocoded location:", location);
        } else {
            alert("Could not find that address.");
        }

        setTimeout(() => scrollToCard(resourcesIndex), 500);
    };


    function scrollToCard(index) {
        const cards = document.querySelectorAll('.story-card');
        if (cards[index]) {
            cards[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function getCardIndexByTitle(title) {
      return cards.findIndex(card => card.title === title);
    }

    function getCardIndexByType(type) {
      return cards.findIndex(card => card.type === type);
    }

    const searchIndex = getCardIndexByType("search")
    const introIndex = getCardIndexByTitle("What is EJNYC?")
    const resourcesIndex = getCardIndexByTitle("Access to Resources")
  
    onMount(async () => {
        // if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        //     theme = 'dark';
        // }

        mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;

        const response = await fetch('/data/nyc_zips.csv');
        const text = await response.text();

        const parsed = Papa.parse(text, { header: true });
        const rows = parsed.data;

        nycZipCodes = new Set(
            rows.map(row => row["ZIP Code"]?.trim()).filter(Boolean)
        );

        map = new mapboxgl.Map({
            container: mapContainer,
            style: 'mapbox://styles/jbonner4/cm9rvo9ct008l01qs3f4215ax',
            center: initialView.center,
            zoom: initialView.zoom,
            dragRotate: true,
            scrollZoom: false,
            boxZoom: false,
            keyboard: false,
            doubleClickZoom: true
        });

        // Prevent scrolling on the map container
        mapContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            // Forward the scroll to the stories container
            const stories = document.querySelector('.stories');
            if (stories) {
                stories.scrollBy(0, e.deltaY);
            }
        }, { passive: false });

        // Prevent body scrolling
        document.body.style.overflow = 'hidden';

        // Add keyboard handler for rotation
        map.on('keydown', (e) => {
            if (e.shiftKey) {
                map.dragRotate.enable();
            }
        });

        map.on('keyup', (e) => {
            if (!e.shiftKey) {
                map.dragRotate.disable();
            }
        });
        
        // map.on('click', 'ejnyc-fill', (e) => {
        //   const properties = e.features[0].properties;
        //   selectedEJArea = properties;
        // });

        // map.on('click', 'ejnyc-fill', (e) => {
        //     const feature = e.features[0];
        //     const props = feature.properties;

        //     // If popup already exists, remove it
        //     if (ejnycPopup) ejnycPopup.remove();

        //     // Get centroid of the polygon
        //     const coordinates = turf.centroid(feature).geometry.coordinates;

        //     // Create plain language HTML content
        //     const content = `
        //       <div style="max-width: 250px; font-size: 0.85rem;">
        //         <strong>${props.NTAName}</strong><br/>
        //         <strong>Borough:</strong> ${props.BoroName}<br/>
        //         <strong>Status:</strong> ${props.DAC_Desig}<br/>
        //         <strong>Income Level:</strong> ${props.Income}<br/>
        //         <strong>Race/Ethnicity:</strong> ${props.RaceEth}
        //       </div>
        //     `;

        //     // Create and show the popup
        //     ejnycPopup = new mapboxgl.Popup({ closeOnClick: true, offset: 15 })
        //       .setLngLat(coordinates)
        //       .setHTML(content)
        //       .addTo(map);
        //   });


        // Add navigation control with custom positioning
        map.addControl(new mapboxgl.NavigationControl(), 'bottom-left');

        // Add reset button
        const resetButton = document.createElement('button');
        resetButton.className = 'mapboxgl-ctrl-icon mapboxgl-ctrl-reset';
        resetButton.type = 'button';
        resetButton.setAttribute('aria-label', 'Reset view');
        resetButton.innerHTML = '↺';
        resetButton.addEventListener('click', resetMapView);
        
        const resetControl = document.createElement('div');
        resetControl.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
        resetControl.appendChild(resetButton);
        
        map.addControl({
          onAdd: () => resetControl,
          onRemove: () => resetControl.remove()
        }, 'bottom-left');

        map.on('load', () => {

            console.log('Map loaded: Adding EJNYC layer');
            map.addSource('ejnyc', {
              type: 'geojson',
              data: dacData
            });

            map.addLayer({
              id: 'ejnyc-fill',
              type: 'fill',
              source: 'ejnyc',
              // layout: {
              //   visibility: 'visible' // remove this later
              // },
              paint: {
                'fill-color': '#6a9e4d', // purple for now
                'fill-opacity': ejnycOpacity
              },
              filter: ['==', ['get', 'DAC_Desig'], 'Designated as DAC']
            });

            map.addLayer({
              id: 'ejnyc-outline',
              type: 'line',
              source: 'ejnyc',
              paint: {
                'line-color': '#6a9e4d',
                'line-opacity': ejnycOpacity
              },
              filter: ['==', ['get', 'DAC_Desig'], 'Designated as DAC']
            });
            
            map.setLayoutProperty('ejnyc-fill', 'visibility', 'visible');
            map.setLayoutProperty('ejnyc-outline', 'visibility', 'visible');

            map.addSource('redlining', {
                type: 'geojson',
                data: redliningData
            });

            map.addLayer({
                id: 'redlining-fill',
                type: 'fill',
                source: 'redlining',
                paint: {
                'fill-color': [
                    'match',
                    ['get', 'grade'],
                    'A', '#57f287',
                    'B', '#3498db',
                    'C', '#f1c40f',
                    'D', '#e74c3c',
                    '#000000'
                ],
                'fill-opacity': 0
                }
            });

            map.addLayer({
                id: 'redlining-outline',
                type: 'line',
                source: 'redlining',
                paint: {
                'line-color': '#333',
                'line-width': 1
                }
            });

            map.addSource('dri', {
                type: 'geojson',
                data: driData
            });

            map.addLayer({
                id: 'dri-layer',
                type: 'fill',
                source: 'dri',
                paint: {
                'fill-color': [
                    'match',
                    ['get', 'DisplacementRiskIndex'],
                    'Lowest', '#fee5d9',
                    'Lower', '#fcbba1',
                    'Intermediate', '#fc9272',
                    'Higher', '#fb6a4a',
                    'Highest', '#cb181d',
                    /* default if blank or unknown */ '#000000'
                ],
                'fill-opacity': 0 // initially hidden
                }
            });

            // hide by default
            map.setLayoutProperty('redlining-fill', 'visibility', 'none');
            map.setLayoutProperty('redlining-outline', 'visibility', 'none');
        });
    });

    let showEJNYC = true;

    $: if (map) {
      map.setLayoutProperty('ejnyc-fill', 'visibility', showEJNYC ? 'visible' : 'none');
      map.setLayoutProperty('ejnyc-outline', 'visibility', showEJNYC ? 'visible' : 'none');
    }

    $: if (map) {
      map.setPaintProperty('ejnyc-fill', 'fill-opacity', ejnycOpacity);
      map.setPaintProperty('ejnyc-outline', 'line-opacity', ejnycOpacity);
    }

    $: if (map && cards[currentCardIndex]?.mapView) {
        const view = cards[currentCardIndex].mapView;
        map.flyTo({
            center: view.center,
            zoom: view.zoom,
            essential: true
        });
    }

    // Fade in redlining in Subsection 1
    $: if (map && cards[currentCardIndex]?.label === 'Redlining' && cards[currentCardIndex]?.sectionId === 'resources') {
        map.setLayoutProperty('redlining-fill', 'visibility', 'visible');
        map.setLayoutProperty('redlining-outline', 'visibility', 'visible');
        map.setPaintProperty('redlining-fill', 'fill-opacity-transition', {
            duration: 1000,
            delay: 0
        });
        map.setPaintProperty('redlining-fill', 'fill-opacity-transition', {
            duration: 1000,
            delay: 0
        });
        map.setPaintProperty('redlining-fill', 'fill-opacity', 0.4);
        map.setPaintProperty('dri-layer', 'fill-opacity', 0, { duration: 1000 });
    }

    // Fade out redlining and fade in DRI in Subsection 2
    $: if (map && cards[currentCardIndex]?.label === 'Subsection 2' && cards[currentCardIndex]?.sectionId === 'resources') {
        map.setPaintProperty('redlining-fill', 'fill-opacity-transition', {
            duration: 4000,
            delay: 0
        });
        map.setPaintProperty('redlining-fill', 'fill-opacity', 0);
        map.setLayoutProperty('redlining-outline', 'visibility', 'visible');
        map.setPaintProperty('dri-layer', 'fill-opacity-transition', {
            duration: 3000,
            delay: 0
        });
        map.setPaintProperty('dri-layer', 'fill-opacity', 0.4);
    }

    // Hide both if not in those subsections
    $: if (
        map &&
        !(
        (cards[currentCardIndex]?.label === 'Redlining' && cards[currentCardIndex]?.sectionId === 'resources') ||
        (cards[currentCardIndex]?.label === 'Subsection 2' && cards[currentCardIndex]?.sectionId === 'resources')
        )
    ) {
        map.setPaintProperty('dri-layer', 'fill-opacity-transition', {
            duration: 1000,
            delay: 0
        });
        map.setLayoutProperty('redlining-fill', 'visibility', 'none');
        map.setLayoutProperty('redlining-outline', 'visibility', 'none');
        map.setPaintProperty('redlining-fill', 'fill-opacity', 0);
        map.setPaintProperty('dri-layer', 'fill-opacity', 0);
    }

    $: if (map) {
    const label = cards[currentCardIndex]?.label;
    const sectionId = cards[currentCardIndex]?.sectionId;

    if (label === 'What are DACs?' && sectionId === 'ejnyc') {
        map.setPaintProperty('ejnyc-fill', 'fill-opacity', 1.0);
        map.setPaintProperty('ejnyc-outline', 'line-opacity', 1.0);
    } else {
        map.setPaintProperty('ejnyc-fill', 'fill-opacity', ejnycOpacity);
        map.setPaintProperty('ejnyc-outline', 'line-opacity', ejnycOpacity);
    }
}

    
  </script>

{#if stylesLoaded}
        <!-- The map fills the full screen -->
        <div bind:this={mapContainer} class="map-container"></div>

        <!-- <button class="theme-toggle" on:click={toggleTheme}>
            {theme === 'dark' ? '🌙': '☀️'}
        </button> -->

        <!-- <button class="toggle-ejnyc" on:click={() => showEJNYC = !showEJNYC}>
          {showEJNYC ? 'Hide EJ Areas' : 'Show EJ Areas'}
        </button> -->

        <div class="opacity-slider">
          <label for="ejnycOpacity">EJNYC Overlay Opacity</label>
          <input
            type="range"
            id="ejnycOpacity"
            min="0"
            max="1"
            step="0.05"
            bind:value={ejnycOpacity}
            style="--value: {ejnycOpacity * 100}%"
          />
        </div>

      <!-- Left-side vertical navigation bar -->
      <div class="navbar">
        <!-- Intro icon FIRST -->

        <div class="nav-wrapper">
            <button
              class="nav-button {cards[currentCardIndex]?.sectionId === 'ejnyc' ? 'active' : ''}"
              on:click={() => scrollToCard(introIndex)}
              data-color="orange"
            >
              <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140.29 216">
                <defs>
                  <style>
                    .cls-1 {
                      fill:currentColor;
                    }
                  </style>
                </defs>
                <g id="Layer_1-2" data-name="Layer 1">
                  <path class="cls-1" d="M42.01,149.56c-2.69,0-4.86-2.18-4.86-4.86v-6.67c0-5.88.44-10.62,1.36-14.27.91-3.63,2.74-6.72,5.48-9.23,2.72-2.54,6.81-5.11,12.27-7.75l15.48-7.58c2.62-1.41,6.12-3.48,10.47-6.22,4.35-2.72,8.22-6.52,11.68-11.38,3.43-4.84,5.16-11.01,5.16-18.49,0-8.49-2.64-15.33-7.9-20.49-5.26-5.14-12.32-7.73-21.23-7.73s-16.59,2.64-21.85,7.9c-4.34,4.34-6.88,9.85-7.64,16.53-.28,2.48-2.34,4.38-4.83,4.38H4.87C2.04,63.7-.18,61.3.01,58.48c.68-10.04,3.34-19.17,8-27.4,5.48-9.6,13.46-17.18,23.97-22.74C42.5,2.79,55.24,0,70.2,0c13.75,0,25.9,2.47,36.42,7.43,10.52,4.96,18.76,12.2,24.71,21.7,5.97,9.51,8.96,20.91,8.96,34.27s-3.6,25.23-10.76,35.65c-7.18,10.42-16.34,18.47-27.45,24.12l-21.85,10.91c-3.04,1.43-5.21,2.74-6.52,3.95-1.33,1.21-1.98,3.43-1.98,6.67h0c0,2.69-2.18,4.86-4.86,4.86h-24.86ZM28.95,211.14v-38.81c0-2.69,2.18-4.86,4.86-4.86h42.46c2.69,0,4.86,2.18,4.86,4.86v38.81c0,2.69-2.18,4.86-4.86,4.86h-42.46c-2.69,0-4.86-2.18-4.86-4.86Z"/>
                </g>
              </svg>
            </button>
          
            <div class="tooltip tooltip-clickable">
              <ul>
                <li>
                  <button
                    type="button"
                    on:click={() => scrollToCard(introIndex)}
                    class="tooltip-button"
                  >
                    What is EJNYC?
                  </button>
                </li>
              </ul>
            </div>
          </div>
      
        <!-- Then search icon -->
        <div class="nav-wrapper">
            <button
              class="nav-button {currentCardIndex === 3 ? 'active' : ''}"
              on:click={() => scrollToCard(searchIndex)}
              data-color="black"
            >
              <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 216 216">
                <defs>
                  <style>
                    .cls-1 {
                      fill:currentColor;
                    }
                  </style>
                </defs>
                <g id="Layer_1-2" data-name="Layer 1">
                  <path class="cls-1" d="M212.04,192.92l-73.63-73.63c-4.1-4.1-5.16-10.36-2.56-15.54,4.91-9.79,7.65-20.85,7.57-32.54C143.15,32.08,110.91.04,71.78,0,32.18-.04-.04,32.18,0,71.78c.04,39.13,32.08,71.37,71.21,71.64,11.7.08,22.76-2.66,32.54-7.57,5.18-2.6,11.44-1.53,15.54,2.56l73.63,73.63c5.28,5.28,13.84,5.28,19.12,0h0c5.28-5.28,5.28-13.84,0-19.12ZM27.22,75.79c-2.48-27.83,20.74-51.05,48.57-48.57,21.33,1.9,38.51,19.08,40.41,40.41,2.48,27.83-20.74,51.05-48.57,48.57-21.33-1.9-38.51-19.08-40.41-40.41Z"/>
                </g>
              </svg>
            </button>
          
            <div class="tooltip tooltip-clickable">
              <ul>
                <li>
                  <button
                    type="button"
                    on:click={() => scrollToCard(searchIndex)}
                    class="tooltip-button"
                  >
                    Find my address
                  </button>
                </li>
              </ul>
            </div>
          </div>
      
        <!-- Then the rest of the sections -->
        {#each navSections as section}
          <div class="nav-wrapper">
            <button
              class="nav-button {cards[currentCardIndex]?.sectionId === section.sectionId ? 'active' : ''}"
              on:click={() => scrollToCard(section.iconIndex)}
              data-color={
                section.sectionId === "resources" ? "green" :
                section.sectionId === "air" ? "brown" :
                section.sectionId === "hazards" ? "yellow" :
                section.sectionId === "housing" ? "gray" :
                section.sectionId === "water" ? "blue" :
                section.sectionId === "climate" ? "red-orange" :
                "black"
              }
            >
            {#if section.sectionId === "ejnyc"}
                <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140.29 216">
                  <defs>
                    <style>
                      .cls-1 {
                        fill:currentColor;
                      }
                    </style>
                  </defs>
                  <g id="Layer_1-2" data-name="Layer 1">
                    <path class="cls-1" d="M42.01,149.56c-2.69,0-4.86-2.18-4.86-4.86v-6.67c0-5.88.44-10.62,1.36-14.27.91-3.63,2.74-6.72,5.48-9.23,2.72-2.54,6.81-5.11,12.27-7.75l15.48-7.58c2.62-1.41,6.12-3.48,10.47-6.22,4.35-2.72,8.22-6.52,11.68-11.38,3.43-4.84,5.16-11.01,5.16-18.49,0-8.49-2.64-15.33-7.9-20.49-5.26-5.14-12.32-7.73-21.23-7.73s-16.59,2.64-21.85,7.9c-4.34,4.34-6.88,9.85-7.64,16.53-.28,2.48-2.34,4.38-4.83,4.38H4.87C2.04,63.7-.18,61.3.01,58.48c.68-10.04,3.34-19.17,8-27.4,5.48-9.6,13.46-17.18,23.97-22.74C42.5,2.79,55.24,0,70.2,0c13.75,0,25.9,2.47,36.42,7.43,10.52,4.96,18.76,12.2,24.71,21.7,5.97,9.51,8.96,20.91,8.96,34.27s-3.6,25.23-10.76,35.65c-7.18,10.42-16.34,18.47-27.45,24.12l-21.85,10.91c-3.04,1.43-5.21,2.74-6.52,3.95-1.33,1.21-1.98,3.43-1.98,6.67h0c0,2.69-2.18,4.86-4.86,4.86h-24.86ZM28.95,211.14v-38.81c0-2.69,2.18-4.86,4.86-4.86h42.46c2.69,0,4.86,2.18,4.86,4.86v38.81c0,2.69-2.18,4.86-4.86,4.86h-42.46c-2.69,0-4.86-2.18-4.86-4.86Z"/>
                  </g>
                </svg>
              {:else if section.sectionId === "resources"}
                <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 159.64 216.07">
                  <defs>
                    <style>
                      .cls-1 {
                        fill:currentColor;
                      }
                    </style>
                  </defs>
                  <g id="Layer_1-2" data-name="Layer 1">
                    <path class="cls-1" d="M158.82,178l-25.31-39.31c-2.19-3.4.25-7.88,4.3-7.88h8.26c4.16,0,6.58-4.7,4.16-8.08l-26.54-37.18c-2.42-3.38,0-8.08,4.16-8.08h0c4.16,0,6.58-4.7,4.16-8.08L83.98,2.14c-2.04-2.86-6.28-2.86-8.32,0L27.64,69.39c-2.42,3.38,0,8.08,4.16,8.08h0c4.16,0,6.58,4.7,4.16,8.08l-26.54,37.18c-2.42,3.38,0,8.08,4.16,8.08h8.26c4.05,0,6.49,4.48,4.3,7.88L.82,178c-2.19,3.4.25,7.88,4.3,7.88h45.56c2.82,0,5.11,2.29,5.11,5.11v19.97c0,2.82,2.29,5.11,5.11,5.11h37.82c2.82,0,5.11-2.29,5.11-5.11v-19.97c0-2.82,2.29-5.11,5.11-5.11h45.56c4.05,0,6.49-4.48,4.3-7.88Z"/>
                  </g>
                </svg>
              {:else if section.sectionId === "air"}
                <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 199.78 216">
                  <defs>
                    <style>
                      .cls-1 {
                        fill:currentColor;
                      }
                    </style>
                  </defs>
                  <g id="Layer_1-2" data-name="Layer 1">
                    <g>
                      <path class="cls-1" d="M193.48,142.74l-34.84-21.63c-2.02-1.25-4.44-1.69-6.77-1.23l-83.11,16.62c-5.53,1.11-10.78-2.9-11.17-8.53l-3.03-43.71c-.34-4.91-4.42-8.71-9.34-8.71s-8.91,3.72-9.32,8.56l-4.8,55.7c-.25,2.94-1.88,5.59-4.39,7.15l-22.29,13.83c-2.75,1.71-4.42,4.71-4.42,7.95v37.9c0,5.17,4.19,9.36,9.36,9.36h179.19c5.17,0,9.36-4.19,9.36-9.36v-55.95c0-3.24-1.67-6.24-4.42-7.95Z"/>
                      <path class="cls-1" d="M46.05,71.15c3.48.43,6.66-.65,9.02-2.64,1.58-1.33,3.86-1.52,5.71-.59.28.14.56.27.85.4,1.3.56,2.34,1.58,2.85,2.91,3.24,8.42,10.88,14.55,19.95,15.76,2.38.32,4.1,2.38,4.25,4.78,0,.02,0,.03,0,.05.84,12.78,11.87,22.47,24.66,21.63,5.14-.34,9.77-2.33,13.42-5.41,1.74-1.48,4.28-1.53,6.14-.19,3.49,2.52,7.86,3.88,12.49,3.58,8.57-.56,15.47-6.67,17.42-14.59.41-1.68,1.72-3.02,3.38-3.48,9.68-2.72,16.47-11.92,15.78-22.37-.18-2.69-.84-5.24-1.89-7.56-1.14-2.51.05-5.42,2.54-6.59,11.7-5.49,19.09-18.31,16.69-32.19C196.93,10.75,184.76.3,170.67,0c-8.5-.18-16.11,3.13-21.61,8.52-1.83,1.8-4.76,1.84-6.71.18-4.68-4-10.87-6.25-17.51-5.81-7.55.49-14.08,4.37-18.21,10.05-1.16,1.6-3.15,2.39-5.08,1.98-2.18-.46-4.46-.63-6.79-.48-10.9.71-19.7,8.31-22.44,18.27-.6,2.19-2.49,3.74-4.76,3.83-.16,0-.31.01-.47.02-5.9.39-10.88,3.82-13.5,8.68-.97,1.79-2.89,2.94-4.91,2.75-.61-.06-1.23-.07-1.86-.03-7.17.47-12.41,7.35-10.49,14.69,1.18,4.5,5.1,7.92,9.72,8.49Z"/>
                    </g>
                  </g>
                </svg>
              {:else if section.sectionId === "hazards"}
                <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 216 190.2">
                  <defs>
                    <style>
                      .cls-1 {
                        fill:currentColor;
                      }
                    </style>
                  </defs>
                  <g id="Layer_1-2" data-name="Layer 1">
                    <path class="cls-1" d="M214.4,172.45L118.25,5.92c-4.55-7.89-15.94-7.89-20.49,0L1.6,172.45c-4.55,7.89,1.14,17.75,10.25,17.75h192.3c9.11,0,14.8-9.86,10.25-17.75ZM102.83,46.51h10.32c4.51,0,8.12,3.73,7.97,8.24l-2.33,69.97c-.14,4.3-3.67,7.71-7.97,7.71h-5.81c-4.31,0-7.84-3.42-7.97-7.73l-2.18-69.97c-.14-4.5,3.47-8.22,7.97-8.22ZM123.36,163.57c0,4.4-3.57,7.97-7.97,7.97h-14.78c-4.4,0-7.97-3.57-7.97-7.97v-12.63c0-4.4,3.57-7.97,7.97-7.97h14.78c4.4,0,7.97,3.57,7.97,7.97v12.63Z"/>
                  </g>
                </svg>
              {:else if section.sectionId === "housing"}
                <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 216 218.19">
                  <defs>
                    <style>
                      .cls-1 {
                        fill:currentColor;
                      }
                    </style>
                  </defs>
                  <g id="Layer_1-2" data-name="Layer 1">
                    <path class="cls-1" d="M147.66,39.87V6c0-3.31-2.68-6-6-6h-55.1c-3.31,0-6,2.68-6,6v131.24c0,1.77-1.44,3.21-3.21,3.21h-1.89c-1.77,0-3.21-1.44-3.21-3.21v-56.91c0-1.77-1.44-3.21-3.21-3.21h-.71c-1.77,0-3.21-1.44-3.21-3.21v-.63c0-1.77-1.44-3.21-3.21-3.21h-1.11c-1.77,0-3.21-1.44-3.21-3.21v-.63c0-1.77-1.44-3.21-3.21-3.21h-.63c-1.77,0-3.21-1.44-3.21-3.21v-.63c0-1.77-1.44-3.21-3.21-3.21h0c-1.77,0-3.21-1.44-3.21-3.21v-.63c0-1.77-1.44-3.21-3.21-3.21h-9.57c-1.77,0-3.21,1.44-3.21,3.21v.63c0,1.77-1.44,3.21-3.21,3.21h0c-1.77,0-3.21,1.44-3.21,3.21v.63c0,1.77-1.44,3.21-3.21,3.21h-.63c-1.77,0-3.21,1.44-3.21,3.21v.63c0,1.77-1.44,3.21-3.21,3.21h-1.11c-1.77,0-3.21,1.44-3.21,3.21v.63c0,1.77-1.44,3.21-3.21,3.21h-.71c-1.77,0-3.21,1.44-3.21,3.21v131.87c0,3.31,2.68,6,6,6h204.01c3.31,0,6-2.68,6-6V19.72c0-4.49-4.75-7.39-8.75-5.33l-54.92,28.34c-2.14,1.1-4.68-.45-4.68-2.85Z"/>
                  </g>
                </svg>
              {:else if section.sectionId === "water"}
                <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 214.27 142.94">
                  <defs>
                    <style>
                      .cls-1 {
                        fill:currentColor;
                      }
                    </style>
                  </defs>
                  <g id="Layer_1-2" data-name="Layer 1">
                    <g>
                      <path class="cls-1" d="M200.73,81.93c-12.28-15.46-28.32-20.1-36.79-21.49-.29-.05-.57-.07-.84-.07h-10.89c-1.96,0-3.67,1.04-4.7,2.86-1.17,2.08-1.13,4.65.11,6.7l.09.16c5.89,9.8,14.33,31.29,4.59,64.88-.58,1.99-.2,4.15,1.01,5.76,1.06,1.41,2.62,2.21,4.28,2.21h49.99c2.68,0,4.98-2.09,5.47-4.97,2.11-12.48,3.32-36.36-12.32-56.05Z"/>
                      <path class="cls-1" d="M148.68,83.79c-.89-2.7-2.17-5.27-3.87-7.55-5.22-7.02-8.59-18.01-8.59-30.36,0-21.2,9.9-38.39,22.12-38.39s22.12,17.19,22.12,38.39c0,4.08-.37,8.01-1.05,11.7-.23,1.27.44,2.52,1.62,3.05l.05.02c1.7.77,3.7-.25,4.03-2.09.74-4.08,1.13-8.39,1.13-12.86,0-25.24-12.57-45.71-28.07-45.71H28.07C12.57,0,0,20.46,0,45.71s12.57,45.71,28.07,45.71h119c1.85,0,3.24-1.74,2.79-3.53-.34-1.37-.74-2.74-1.18-4.1Z"/>
                    </g>
                  </g>
                </svg>
              {:else if section.sectionId === "climate"}
                <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 214.18 201.7">
                  <defs>
                    <style>
                      .cls-1 {
                        fill:currentColor;
                      }
                    </style>
                  </defs>
                  <g id="Layer_1-2" data-name="Layer 1">
                    <g>
                      <path class="cls-1" d="M22,39.84c25.73-8.58,54.08-8.58,79.8,0l.74.25c16.04,5.34,32.88,8.02,49.73,8.02,16.85,0,33.7-2.67,49.74-8.02l.74-.25c8.75-2.92,13.48-12.39,10.56-21.14-2.92-8.75-12.38-13.48-21.14-10.56l-.73.24c-25.26,8.42-53.08,8.42-78.33,0l-.74-.25C79.83-2.71,43.98-2.71,11.43,8.14,2.68,11.06-2.06,20.52.86,29.27c2.92,8.76,12.38,13.49,21.14,10.57Z"/>
                      <path class="cls-1" d="M192.18,84.94l-.73.24c-25.26,8.42-53.08,8.42-78.33,0l-.74-.25c-32.55-10.85-68.4-10.85-100.95,0-8.76,2.92-13.49,12.38-10.57,21.14,2.92,8.76,12.38,13.49,21.14,10.57,25.73-8.58,54.08-8.58,79.8,0l.74.25c16.04,5.34,32.88,8.02,49.73,8.02s33.7-2.67,49.74-8.02l.74-.25c8.75-2.92,13.48-12.39,10.56-21.14-2.92-8.75-12.38-13.48-21.14-10.56Z"/>
                      <path class="cls-1" d="M192.18,161.74l-.73.24c-25.26,8.42-53.08,8.42-78.33,0l-.74-.25c-32.55-10.85-68.4-10.85-100.95,0-8.76,2.92-13.49,12.38-10.57,21.14,2.92,8.75,12.38,13.49,21.14,10.57,25.73-8.58,54.08-8.58,79.8,0l.74.25c16.04,5.34,32.88,8.02,49.73,8.02s33.7-2.67,49.74-8.02l.74-.25c8.75-2.92,13.48-12.39,10.56-21.14-2.92-8.75-12.38-13.48-21.14-10.56Z"/>
                    </g>
                  </g>
                </svg>
              {:else}
                📍
              {/if}
            </button>
      
            <!-- Tooltip -->
            <div class="tooltip tooltip-clickable">
              <ul>
                {#each section.items as item}
                  <li>
                    <button
                      type="button"
                      on:click={() => scrollToCard(item.index)}
                      class="tooltip-button"
                    >
                      {item.label}
                    </button>
                  </li>
                {/each}
              </ul>
            </div>
          </div>
        {/each}
      </div>
      

      <!-- Sidebar with stories and search -->
      <div class="sidebar">
        <div class="stories">
          {#each cards as card, i}
            <div
              class="story-card"
              use:observeCard={i}
              class:selected={i === currentCardIndex}
              data-color={
                card.sectionId === "resources" ? "green" :
                card.sectionId === "air" ? "brown" :
                card.sectionId === "hazards" ? "yellow" :
                card.sectionId === "housing" ? "gray" :
                card.sectionId === "water" ? "blue" :
                card.sectionId === "climate" ? "red-orange" :
                card.sectionId === "ejnyc" ? "orange" :
                ""
              }
            >
              {#if card.sectionId && card.sectionId !== 'search'}
                <div class="card-tab">{
                  card.sectionId === 'ejnyc' ? 'Intro' :
                  card.sectionId === 'resources' ? 'Access to Resources' :
                  card.sectionId === 'air' ? 'Polluted Air' :
                  card.sectionId === 'hazards' ? 'Hazardous Materials' :
                  card.sectionId === 'housing' ? 'Access to Housing' :
                  card.sectionId === 'water' ? 'Polluted Water' :
                  card.sectionId === 'climate' ? 'Climate Change' :
                  ''
                }</div>
              {/if}
              {#if card.type === "search"}
                <h2>Enter your address to see insights specific to your area throughout the project:</h2>
                <form on:submit|preventDefault={handleSubmit} class="search-bar">
                  <input
                    type="text"
                    bind:value={address}
                    placeholder="New York City Address..."
                  />
                  <button type="submit">Go</button>
                </form>
                {#if zipError}
                    <p style="color: red; margin-top: 0.25rem; margin-bottom: 0rem; font-size: 0.8rem; font-weight:800; font-style:italic">{zipError}</p>
                {/if}
              {:else}
                <h2>{card.title}</h2>
                <p>{@html card.content}</p>
                <ul>
                    {#each card.subsections as sub}
                      <li>{sub}</li>
                    {/each}
                </ul>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- {#if selectedEJArea}
        <div class="ejnyc-popup">
          <button class="popup-close" on:click={closeEJNYCInfo}>×</button>
          <h3>Environmental Justice Area</h3>
          <ul>
            <li><strong>Name:</strong> {selectedEJArea.NTAName}</li>
            <li><strong>Borough:</strong> {selectedEJArea.BoroName}</li>
            <li><strong>Status:</strong> {selectedEJArea.DAC_Desig}</li>
            <li><strong>Income Level:</strong> {selectedEJArea.Income}</li>
            <li><strong>Race/Ethnicity:</strong> {selectedEJArea.RaceEth}</li>
            <!-- Add any others you'd like -->
          <!-- </ul>
        </div>
      {/if} -->

{/if}

  <style>
    /* Prevent body scrolling */
    :global(body) {
      overflow: hidden;
      margin: 0;
      padding: 0;
    }

    /* The map fills the screen and sits underneath everything else */
    .map-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 0;
      overflow: hidden;
      touch-action: none;
    }

    .sidebar {
      position: fixed;
      right: 0;
      top: 0;
      bottom: 0;
      width: 25%;
      display: flex;
      flex-direction: column;
      padding: 1rem;
      box-sizing: border-box;
      z-index: 1;
      overflow: hidden;
    }

    .stories {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding-right: 0.5rem;
    }

    /* Hide scrollbar but keep functionality */
    .stories::-webkit-scrollbar {
      width: 6px;
    }

    .stories::-webkit-scrollbar-track {
      background: transparent;
    }

    .stories::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }

    .stories::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.3);
    }

    .search-bar {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
      width: 100%;
    }

    .search-bar input {
      font-family: 'Host Grotesk', system-ui, sans-serif;
      flex: 1;
      padding: 0.5rem;
      border-radius: 4px;
      border: 1px solid #ccc;
    }

    .search-bar button {
        font-family: 'Host Grotesk', system-ui, sans-serif;
        font-weight: 900;
      padding: 0.5rem 1rem;
      background: black;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .story-card {
      margin-top: 8rem;
      margin-bottom: 45vh;
      padding: 1rem;
      background: white;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .card-tab {
      position: absolute;
      top: 0rem;
      left: 1rem;
      background-color: currentColor;
      color: white;
      padding: 0.2rem 0.6rem;
      font-size: 0.7rem;
      font-weight: bold;
      border-radius: 4px 4px 0 0;
      transform: translateY(-100%);
      z-index: 2;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .story-card {
      position: relative; /* Needed to position tab inside */
    }

    .story-card[data-color="green"] .card-tab {
      background-color: #2ecc71;
    }

    .story-card[data-color="brown"] .card-tab {
      background-color: #8e5a2b;
    }

    .story-card[data-color="yellow"] .card-tab {
      background-color: #f1c40f;
    }

    .story-card[data-color="gray"] .card-tab {
      background-color: #7f8c8d;
    }

    .story-card[data-color="blue"] .card-tab {
      background-color: #3498db;
    }

    .story-card[data-color="red-orange"] .card-tab {
      background-color: #e74c3c;
    }

    .story-card[data-color="orange"] .card-tab {
      background-color: orange;
    }

    /* .story-card[data-color="black"] .card-tab {
      background-color: black;
    } */


    /* Style for the reset button */
    :global(.mapboxgl-ctrl-reset) {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      line-height: 1;
      padding: 0;
      background: transparent;
      width: 32px;
      height: 32px;
      cursor: pointer;
    }

    .navbar {
        position: fixed;
        left: 0;
        top: 45%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        gap: 2.5rem;
        padding: 1rem;
        z-index: 2;
    }

    .nav-button {
        background: none;
        border: none;
        border-radius: 50%;
        font-size: 1.2rem;
        width: 2rem;
        height: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: .2s ease;
        color: black;
    }

    .nav-button svg {
      width: 2rem;
      height: 2rem;
      display: block;
      fill: currentColor;
    }

    /* Hover/active colors by section */
    .nav-button[data-color="green"]:hover,
    .nav-button[data-color="green"].active {
      color: #2ecc71; /* green */
    }

    .nav-button[data-color="brown"]:hover,
    .nav-button[data-color="brown"].active {
      color: #8e5a2b; /* brown */
    }

    .nav-button[data-color="yellow"]:hover,
    .nav-button[data-color="yellow"].active {
      color: #f1c40f; /* yellow */
    }

    .nav-button[data-color="gray"]:hover,
    .nav-button[data-color="gray"].active {
      color: #7f8c8d; /* gray */
    }

    .nav-button[data-color="blue"]:hover,
    .nav-button[data-color="blue"].active {
      color: #3498db; /* blue */
    }

    .nav-button[data-color="red-orange"]:hover,
    .nav-button[data-color="red-orange"].active {
      color: #e74c3c; /* red-orange */
    }

    .nav-button[data-color="orange"]:hover,
    .nav-button[data-color="orange"].active {
      color: orange;
    }

    .nav-button[data-color="black"]:hover,
    .nav-button[data-color="black"].active {
      color: black;
    }

    .nav-button:hover {
      width: 2.5rem;
      height: 2.5rem;
      padding-top: 2rem;
      padding-bottom: 2rem;
    }

    /* .nav-button.active {
        background: black;
        color: white;
        border-color: black;
    } */

    .nav-wrapper {
        position: relative;
        display: flex;
        align-items: center;
    }

    .tooltip {
        position: absolute;
        left: 3rem;
        color: black;
        background-color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        white-space: nowrap;
        opacity: 0;
        transform: translateY(-50%);
        top: 50%;
        pointer-events: none;
        transition: opacity 0.2s ease;
    }

    /* Reveal tooltip on hover of nav-wrapper */
    .nav-wrapper:hover .tooltip {
      opacity: 1;
    }

    /* Tooltip color matching */
    .nav-wrapper .nav-button[data-color="green"] + .tooltip {
      color: #2ecc71;
    }

    .nav-wrapper .nav-button[data-color="brown"] + .tooltip {
      color: #8e5a2b;
    }

    .nav-wrapper .nav-button[data-color="yellow"] + .tooltip {
      color: #f1c40f;
    }

    .nav-wrapper .nav-button[data-color="gray"] + .tooltip {
      color: #7f8c8d;
    }

    .nav-wrapper .nav-button[data-color="blue"] + .tooltip {
      color: #3498db;
    }

    .nav-wrapper .nav-button[data-color="red-orange"] + .tooltip {
      color: #e74c3c;
    }

    .nav-wrapper .nav-button[data-color="orange"] + .tooltip {
      color: #e67e22;
    }

    .nav-wrapper .nav-button[data-color="black"] + .tooltip {
      color: #111;
    }

    /* .section-explainer {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    } */

    :global(.section-table) {
      width: 100%;
      border-collapse: collapse;
      margin: 0rem 0;
    }

    :global(.section-table tr) {
      vertical-align: center;
      padding: 0;
    }

    :global(.section-table td) {
      padding: 0rem 0.5rem; /* reduce this further if needed */
    }


    :global(.icon-cell) {
      width: 1.5rem;
      vertical-align: center;
      padding-right: 0.75rem;
    }

    :global(.icon-cell) svg {
      width: 1rem;
      height: 1rem;
      fill: currentColor;
    }

    :global(.text-cell) {
      font-size: 0.9rem;
      padding-bottom: 0.25rem;
    }

    :global(.section-resources) { color: #2ecc71; }
    :global(.section-air) { color: #8e5a2b; }
    :global(.section-hazards) { color: #f1c40f; }
    :global(.section-housing) { color: #7f8c8d; }
    :global(.section-water) { color: #3498db; }
    :global(.section-climate) { color: #e74c3c; }



    :global(body) {
        font-family: 'Host Grotesk', system-ui, sans-serif;
        overflow: hidden;
        margin: 0;
        padding: 0;
        background-color: #f9f9f9;
        color: #222;
    }

    /* :global(body.light) {
        background: #f9f9f9;
        color: #111;
    }

    :global(body.dark) {
        background: #111;
        color: #eee;
    } */

    .sidebar {
        background: var(--sidebar-bg);
    }

    .story-card {
        background: var(--card-bg);
        color: var(--card-text);
    }

    /* Set defaults for both modes */
    /* :global(.light) {
        --card-bg: #ffffff;
        --card-text: #222;
        --toggle-bg: black;
    }

    :global(.dark) {
        --card-bg: #2a2a2a;
        --card-text: #eee;
        --toggle-bg: white;
    } */

    /* SETS THE COLOR FOR THE CARDS */
    :global(html) {
    --card-bg: #ffffff;
    --card-text: #222;
    --toggle-bg: black;
    }

    /* Style the toggle button */
    /* .theme-toggle {
        position: fixed;
        top: 1rem;
        left: 1rem;
        z-index: 10;
        background-color: var(--toggle-bg);
        border-radius: 50%;
        border: 1px solid #ccc;
        width: 2.5rem;
        height: 2.5rem;
        font-size: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.3s ease, border-color 0.3s ease;
    } */

    /* .toggle-ejnyc {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 10;
      padding: 0.5rem 1rem;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
    } */

    .opacity-slider {
      width: 10%;
      position: fixed;
      top: 1rem;
      left: 1rem;
      z-index: 10;
      background: white;
      padding: 1rem;
      border-radius: 6px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
      font-size: 0.85rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .opacity-slider input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      background: linear-gradient(to right, rgba(106, 158, 77, var(--value)) var(--value), #ccc var(--value));
      border: 1.5px solid #6a9e4d;
      border-radius: 3px;
      outline: none;
      cursor: pointer;
    }

    .opacity-slider input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 0;
      height: 0;
      background: transparent;
      border: none;
    }

    .opacity-slider input[type="range"]::-moz-range-thumb {
      width: 0;
      height: 0;
      background: transparent;
      border: none;
    }

    .tooltip.tooltip-clickable {
        left: 3rem;
        top: 50%;
        transform: translateY(-50%);
        background: transparent; /* removed background */
        color: black;
        padding: 0;
        font-size: 0.8rem;
        opacity: 0;
        pointer-events: auto;
        transition: opacity 0.2s ease;
        white-space: nowrap;
        z-index: 3;
    }

    .nav-wrapper:hover .tooltip-clickable {
        opacity: 1;
    }

    .tooltip-clickable ul {
        list-style: none;
        margin: 0;
        padding: 0;
    }


    .tooltip-clickable li:last-child {
        border-bottom: none;
    }

    .tooltip-clickable button.tooltip-button {
        all: unset;
        font: inherit;
        color: inherit;
        cursor: pointer;
        padding: 0.3rem 0;
        width: 100%;
        text-align: left;
    }

    .tooltip-clickable button.tooltip-button:hover {
        text-decoration: underline;
    }

    /* :global(.light) .tooltip-button:focus {
        outline: 2px solid black;
    } */

    /* .ejnyc-popup {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      background: white;
      color: black;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 1rem;
      max-width: 300px;
      z-index: 4;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    }

    .popup-close {
      position: absolute;
      top: 0.4rem;
      right: 0.6rem;
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
    } */

  </style>
  
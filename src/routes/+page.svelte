<script>
    import mapboxgl from 'mapbox-gl';
    import 'mapbox-gl/dist/mapbox-gl.css';
    import { onMount } from 'svelte';
    import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
    import Papa from 'papaparse';
    import redliningData from '/src/data/redlining_all_boroughs.json';
    import driData from '/src/data/nta_dri_merged.json';

  
    let address = "";
    let mapContainer;
    let map;
    let theme = 'light';
    let userMarker = null;
    let nycZipCodes = new Set();
    let zipError = "";


    // Store initial view for reset
    let initialView = {
      center: [-74.006, 40.7128],
      zoom: 10,
      pitch: 0,
      bearing: 0
    };

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


    function toggleTheme() {
        theme = theme === 'dark' ? 'light' : 'dark';
    }

    // New: list of all story steps including the search bar
    let cards = [
        { type: "search" },

        // Access to Resources
        {
            sectionId: "resources",
            type: "intro",
            label: "Access to Resources",
            title: "Access to Resources",
            content: "Intro content for Access to Resources."
        },
        {
            sectionId: "resources",
            type: "subsection",
            label: "Subsection 1",
            title: "Subsection 1",
            content: "Placeholder content for Subsection 1."
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
            if (card.type === 'intro') {
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
                zipError = "Please enter an address within New York City.";
                return;
            }
        } else {
            zipError = ""; // clear any previous error
        }

        let [lng, lat] = location.center;

        console.log("Final ZIP:", zipCode);
        console.log("Used corrected location:", location.place_name);

        initialView = {
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

        setTimeout(() => scrollToCard(1), 300);
    };


    function scrollToCard(index) {
        const cards = document.querySelectorAll('.story-card');
        if (cards[index]) {
            cards[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  
    onMount(async () => {

        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            theme = 'dark';
        }

        mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;

        const response = await fetch('/src/data/nyc_zips.csv');
        const text = await response.text();

        const parsed = Papa.parse(text, { header: true });
        const rows = parsed.data;

        nycZipCodes = new Set(
            rows.map(row => row["ZIP Code"]?.trim()).filter(Boolean)
        );

        map = new mapboxgl.Map({
            container: mapContainer,
            style: 'mapbox://styles/mapbox/streets-v11',
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

        // Add navigation control with custom positioning
        map.addControl(new mapboxgl.NavigationControl(), 'bottom-left');

        // Add reset button
        const resetButton = document.createElement('button');
        resetButton.className = 'mapboxgl-ctrl-icon mapboxgl-ctrl-reset';
        resetButton.type = 'button';
        resetButton.setAttribute('aria-label', 'Reset view');
        resetButton.innerHTML = '<span class="mapboxgl-ctrl-icon" aria-hidden="true"></span>';
        resetButton.addEventListener('click', resetMapView);
        
        const resetControl = document.createElement('div');
        resetControl.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
        resetControl.appendChild(resetButton);
        
        map.addControl({
          onAdd: () => resetControl,
          onRemove: () => resetControl.remove()
        }, 'bottom-left');

        map.on('load', () => {
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

    $: if (map && cards[currentCardIndex]?.mapView) {
        const view = cards[currentCardIndex].mapView;
        map.flyTo({
            center: view.center,
            zoom: view.zoom,
            essential: true
        });
    }

    // Fade in redlining in Subsection 1
    $: if (map && cards[currentCardIndex]?.label === 'Subsection 1' && cards[currentCardIndex]?.sectionId === 'resources') {
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
        (cards[currentCardIndex]?.label === 'Subsection 1' && cards[currentCardIndex]?.sectionId === 'resources') ||
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
    
  </script>

<div class={theme}>
    <!-- The map fills the full screen -->
    <div bind:this={mapContainer} class="map-container"></div>

    <button class="theme-toggle" on:click={toggleTheme}>
        {theme === 'dark' ? '🌙': '☀️'}
    </button>

  <!-- Left-side vertical navigation bar -->
  <div class="navbar">
     <!-- Search icon -->
    <div class="nav-wrapper">
        <button
        class="nav-button {currentCardIndex === 0 ? 'active' : ''}"
        on:click={() => scrollToCard(0)}
        >
        🔍
        </button>
    </div>
    {#each navSections as section}
      <div class="nav-wrapper">
        <button
            class="nav-button {cards[currentCardIndex]?.sectionId === section.sectionId ? 'active' : ''}"
            on:click={() => scrollToCard(section.iconIndex)}
        >
          {#if section.sectionId === "resources"}
            🌳
          {:else if section.sectionId === "air"}
            🏭
          {:else if section.sectionId === "hazards"}
            ⚠️
          {:else if section.sectionId === "housing"}
            🏠
          {:else if section.sectionId === "water"}
            💧
          {:else if section.sectionId === "climate"}
            🔥
          {:else}
            📍
          {/if}
        </button>
  
        <!-- Hover menu with section intro + subsections -->
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
        >
          {#if card.type === "search"}
            <form on:submit|preventDefault={handleSubmit} class="search-bar">
              <input
                type="text"
                bind:value={address}
                placeholder="Enter your address"
              />
              <button type="submit">Go</button>
            </form>
            {#if zipError}
                <p style="color: red; margin-top: 0.25rem; margin-bottom: 0rem; font-size: 0.8rem; font-weight:800; font-style:italic">{zipError}</p>
            {/if}
          {:else}
            <h2>{card.title}</h2>
            <p>{card.content}</p>
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
</div>

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
      font-family: 'Libre Franklin', system-ui, sans-serif;
      flex: 1;
      padding: 0.5rem;
      border-radius: 4px;
      border: 1px solid #ccc;
    }

    .search-bar button {
        font-family: 'Libre Franklin', system-ui, sans-serif;
        font-weight: 900;
      padding: 0.5rem 1rem;
      background: black;
      color: white;
      border: none;
      border-radius: 4px;
    }

    .story-card {
      margin-top: 45vh;
      margin-bottom: 45vh;
      padding: 1rem;
      background: white;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    /* Style for the reset button */
    :global(.mapboxgl-ctrl-reset) {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z'/%3E%3C/svg%3E");
      background-size: 18px;
      background-position: center;
      background-repeat: no-repeat;
    }

    .navbar {
        position: fixed;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
        z-index: 2;
    }

    .nav-button {
        background: white;
        border: 1px solid #ccc;
        border-radius: 50%;
        font-size: 1.2rem;
        width: 2.5rem;
        height: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s ease;
    }

    .nav-button.active {
        background: black;
        color: white;
        border-color: black;
    }

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

    .nav-wrapper:hover .tooltip {
        opacity: 1;
    }

    :global(body) {
        font-family: 'Libre Franklin', system-ui, sans-serif;
        overflow: hidden;
        margin: 0;
        padding: 0;
        background-color: #f9f9f9;
        color: #222;
    }

    :global(body.light) {
        background: #f9f9f9;
        color: #111;
    }

    :global(body.dark) {
        background: #111;
        color: #eee;
    }

    .sidebar {
        background: var(--sidebar-bg);
    }

    .story-card {
        background: var(--card-bg);
        color: var(--card-text);
    }

    /* Set defaults for both modes */
    :global(.light) {
        --card-bg: #ffffff;
        --card-text: #222;
        --toggle-bg: black;
    }

    :global(.dark) {
        --card-bg: #2a2a2a;
        --card-text: #eee;
        --toggle-bg: white;
    }

    /* Style the toggle button */
    .theme-toggle {
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
    }

    .tooltip.tooltip-clickable {
        left: 3rem;
        top: 50%;
        transform: translateY(-50%);
        background: transparent; /* removed background */
        color: white;
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
        padding: 0.2rem 0;
        width: 100%;
        text-align: left;
    }

    .tooltip-clickable button.tooltip-button:hover {
        text-decoration: underline;
    }

    :global(.light) .tooltip-button:focus {
        outline: 2px solid black;
    }

  </style>
  
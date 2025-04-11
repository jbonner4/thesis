<script>
    import mapboxgl from 'mapbox-gl';
    import 'mapbox-gl/dist/mapbox-gl.css';
    import { onMount } from 'svelte';
    import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
  
    let address = "";
    let mapContainer;
    let map;

    // Store initial view for reset
    const initialView = {
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

    // New: list of all story steps including the search bar
    let cards = [
        { type: "search" },
        { title: "Access to Resources", content: "Placeholder content 1" },
        { title: "Exposure to Polluted Air", content: "Placeholder content 2" },
        { title: "Exposure to Hazardous Materials", content: "Placeholder content 3" },
        { title: "Access to Safe and Healthy Housing", content: "Placeholder content 4" },
        { title: "Exposure to Polluted Water", content: "Placeholder content 5" },
        { title: "Exposure to Climate Change", content: "Placeholder content 6" }
    ];

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
    
    const handleSubmit = () => {
      console.log("Submitted address:", address);
      // Geocoding comes later!
    };
  
    onMount(() => {
        mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;

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
    });

    $: if (map && mapViews[currentCardIndex]) {
        map.flyTo({
            center: mapViews[currentCardIndex].center,
            zoom: mapViews[currentCardIndex].zoom,
            essential: true
        });
    }
    
  </script>
  
  <!-- The map fills the full screen -->
  <div bind:this={mapContainer} class="map-container"></div>

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
          {:else}
            <h2>{card.title}</h2>
            <p>{card.content}</p>
          {/if}
        </div>
      {/each}
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
      flex: 1;
      padding: 0.5rem;
      border-radius: 4px;
      border: 1px solid #ccc;
    }

    .search-bar button {
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
  </style>
  
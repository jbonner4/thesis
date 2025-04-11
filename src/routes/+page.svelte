<script>
    import mapboxgl from 'mapbox-gl';
    import 'mapbox-gl/dist/mapbox-gl.css';
    import { onMount } from 'svelte';
    import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
  
    let address = "";
    let mapContainer;
    let map;

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
            center: [-74.006, 40.7128], // NYC
            zoom: 10
    });

    map.addControl(new mapboxgl.NavigationControl(), 'bottom-left');
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
  
  <!-- Overlay: search + scrollable stories -->
  <div class="overlay">
    
    <!-- Check current card -->
    <!-- <p style="position: fixed; bottom: 10px; left: 10px; background: white; padding: 4px;">
        Current Card: {currentCardIndex}
    </p> -->

    <div class="sidebar">
    
      <div class="stories">
        {#each cards as card, i}
          <div
            class="story-card"
            use:observeCard={i}
            class:selected={i === currentCardIndex}
          >
            {#if card.type === "search"}
              <!-- Render the search bar as a scrollable 'card' -->
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
  </div>

  <style>
    /* The map fills the screen and sits underneath everything else */
    .map-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 0;
    }

    
  
    /* Overlay that sits on top of the map */
    .overlay {
        position: relative;
        z-index: 10;
        display: flex;
        flex-direction: row;
        height: 100vh;
        width: 100%;
        justify-content: flex-end;
    }

    .sidebar {
        width: 25%;
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 1rem;
        box-sizing: border-box;
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
    
    .stories {
        flex: 1;
        overflow-y: auto;
    }

    .story-card {
        margin-top: 45vh;
        margin-bottom: 100vh;
        padding: 1rem;
        background: white;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

  </style>
  
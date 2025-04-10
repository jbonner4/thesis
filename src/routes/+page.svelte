<script>
    import mapboxgl from 'mapbox-gl';
    import 'mapbox-gl/dist/mapbox-gl.css';
    import { onMount } from 'svelte';
    import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
  
    let address = "";
    let mapContainer;
  
    const handleSubmit = () => {
      console.log("Submitted address:", address);
      // Geocoding comes later!
    };
  
    onMount(() => {
      mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;
  
      const map = new mapboxgl.Map({
        container: mapContainer,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-74.006, 40.7128],
        zoom: 10
      });
  
      // Add navigation control with custom positioning
      map.addControl(new mapboxgl.NavigationControl(), 'bottom-left');
    });
  </script>
  
  <!-- The map fills the full screen -->
  <div bind:this={mapContainer} class="map-container"></div>
  
  <!-- Overlay: search + scrollable stories -->
  <div class="overlay">
    <div class="sidebar">
      <!-- Search bar at the top of the sidebar -->
      <form on:submit|preventDefault={handleSubmit} class="search-bar">
        <input
          type="text"
          bind:value={address}
          placeholder="Enter your address"
        />
        <button type="submit">Go</button>
      </form>
    
      <!-- Scrollable stories below -->
      <div class="stories">
        {#each [
          "Access to Resources",
          "Exposure to Polluted Air",
          "Exposure to Hazardous Materials",
          "Access to Safe and Healthy Housing",
          "Exposure to Polluted Water",
          "Exposure to Climate Change"
        ] as topic}
          <div class="story-card">
            <h2>{topic}</h2>
            <p>Placeholder content for this section...</p>
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
      margin-bottom: 1rem;
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
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: white;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

  </style>
  
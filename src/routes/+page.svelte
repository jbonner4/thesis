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
  
      map.addControl(new mapboxgl.NavigationControl());
    });
  </script>
  
  <!-- The map fills the full screen -->
  <div bind:this={mapContainer} class="map-container"></div>
  
  <!-- Overlay: search + scrollable stories -->
  <div class="overlay">
    <!-- Search bar -->
    <form on:submit|preventDefault={handleSubmit} class="search-bar">
      <input
        type="text"
        bind:value={address}
        placeholder="Enter your address"
      />
      <button type="submit">Go</button>
    </form>
  
    <!-- Scrollable story list -->
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
      flex-direction: column;
      height: 100vh;
      padding: 1rem;
      box-sizing: border-box;
    }
  
    .search-bar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
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
        width: 25%; /* take up 1/4 of the screen */
        height: 100%;
        overflow-y: auto;
        background: rgba(255, 255, 255, 0.9);
        padding: 1rem;
        border-left: 1px solid #ccc;
    }

    .story-card {
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: white;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
  </style>
  
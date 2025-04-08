<script>
    import mapboxgl from 'mapbox-gl'; // Import the Mapbox library
    import { onMount } from 'svelte'; // Svelte function to run code when component loads
    import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public'; // Load your token from .env
  
    let address = "";
    let mapContainer; // This will be a reference to the HTML element for the map
  
    const handleSubmit = () => {
      console.log("Submitted address:", address);
      // In future: use Mapbox Geocoding API to look up coordinates
    };
  
    onMount(() => {
      mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;
  
      const map = new mapboxgl.Map({
        container: mapContainer, // Attach map to this element
        style: 'mapbox://styles/mapbox/streets-v11', // Map style
        center: [-74.006, 40.7128], // NYC coordinates (lng, lat)
        zoom: 10
      });
  
      // Optional: add zoom + rotate controls
      map.addControl(new mapboxgl.NavigationControl());
    });
  </script>
  
  <main class="min-h-screen p-4 space-y-6">
    <h1 class="text-3xl font-bold">Environmental Justice NYC</h1>
  
    <form on:submit|preventDefault={handleSubmit} class="flex space-x-2">
      <input
        type="text"
        bind:value={address}
        placeholder="Enter your address"
        class="flex-1 border px-2 py-1 rounded"
      />
      <button type="submit" class="bg-black text-white px-4 py-1 rounded">
        Go
      </button>
    </form>
  
   <!-- Map container: now with a class and explicit closing tag -->
    <section
        class="map-container-section rounded overflow-hidden"
        bind:this={mapContainer}
    ></section>
  
    <section class="grid gap-4 md:grid-cols-2">
      {#each [
        "Access to Resources",
        "Exposure to Polluted Air",
        "Exposure to Hazardous Materials",
        "Access to Safe and Healthy Housing",
        "Exposure to Polluted Water",
        "Exposure to Climate Change"
      ] as topic}
        <div class="p-4 border rounded shadow bg-white">
          <h2 class="font-semibold text-lg">{topic}</h2>
          <p class="text-sm text-gray-600">Placeholder description for this topic.</p>
        </div>
      {/each}
    </section>
  </main>
  
  <style>
    main {
      font-family: system-ui, sans-serif;
    }
  
    /* Mapbox styles sometimes break if not given a height explicitly */
    .map-container-section {
      height: 400px;
    }
  </style>
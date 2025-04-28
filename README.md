# MYEJNYC
![Status: Work in Progress](https://img.shields.io/badge/status-work_in_progress-yellow)


MYEJNYC is a web-based storytelling tool that highlights patterns of environmental injustice across New York City.  
Built as part of my undergraduate honors thesis, it guides users through key findings from the 2024 Environmental Justice NYC (EJNYC) report, combining city data, historical context, and personal narratives.

The project aims to make complex environmental justice data accessible and engaging for residents, researchers, and advocates alike.

## Live Site

You can explore the project here: [MYEJNYC](https://myejnyc.onrender.com)


## Features

- 📍 Find your address and explore environmental risks around you
- 🌎 Interactive Map with layered environmental datasets
- 🧩 Sectioned storytelling: Access to Resources, Air Pollution, Housing, and more
- 🎨 Custom visual design for navigation and thematic overlays
- 🗺️ Smooth transitions between stories and map movements

## Installation & Use

### Requirements
Before you begin, make sure you have the following:

- [Node.js](https://nodejs.org/) (version 20 or higher)
- [npm](https://www.npmjs.com/) (comes bundled with Node.js)
- A Mapbox account and API token (create a token with "Public" scope using a free [Mapbox](https://www.mapbox.com) account)

### Setup Instructions

To run **MYEJNYC** locally:

1. **Clone the repository** by running:
   ```bash
   git clone https://github.com/jbonner4/myejnyc.git
   ```
2. **Install all dependencies:**
    ```bash
    npm install
    ```
3. **Set up environment variables:**
    - Create a `.env` file in the root directory.
    - Add your Mapbox public token:
    ```bash
    PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
    ```
4. **Start the development server:**
    ```bash
    npm run dev
    ```

Once the server is running, open your browser and navigate to http://localhost:5173 to view the site.

### Usage

- Scroll through the stories to explore different themes of environmental justice in New York City.
- Find an address by using the search tool to see personalized information about environmental risks near it.
- Interact with the map by zooming, panning, and rotating the view. Use the reset button (↺) to quickly return to the original view of the city.
- Adjust the opacity of the EJNYC overlay with the slider at the top left to compare different layers as they appear.

## Data Sources

- [NYC Open Data](https://opendata.cityofnewyork.us) — Various datasets on environmental quality, access to resources, and health indicators.
- [EJNYC Mapping Tool](https://experience.arcgis.com/experience/6a3da7b920f248af961554bdf01d668b) — 2024 Environmental Justice NYC (EJNYC) data and boundaries.
- [NYC Displacement Risk Map](https://storymaps.arcgis.com/stories/79237333bb90492ba0de486c0705f9f7) — Department of City Planning and Department of Housing Preservation and Development.
- [Mapping Inequality](https://dsl.richmond.edu/panorama/redlining/) — Historic Home Owners' Loan Corporation (HOLC) Redlining Maps.

Additional data processing and GIS layers were created based on public datasets provided by New York City agencies.


## Acknowledgements
This project was created for my senior thesis as part of the Fordham College at Lincoln Center Honors Program. I'd like to thank the following:
- Ralph Vacca & Jordan Stein — thank you for your patience, understanding, and willingness to support my learning (however long it may have taken!)
- The NYC Mayor's Office of Climate and Environmental Justice for producing the report that insipired this project, and will hopefully inspire understanding of and investment in the risks facing the city
- NYC Open Data or its wealth of data, (and thank you as well to all of the departments and agencies that provide it!)
- Mapping Inequality for its comprehensive history and open access to data on redlining in the U.S.

## License

This project is licensed for educational and non-commercial use only.

You may view, share, and adapt this project for academic or personal purposes with appropriate attribution.  
Commercial use, redistribution, or modification for profit is not permitted without explicit permission.

© 2025 Jason Bonner. All rights reserved.


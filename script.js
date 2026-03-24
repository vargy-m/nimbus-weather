/* VARIABLES */

const apiKey = 'adac38263e00fa12ab5e22648025f4f4';
let city = 'San Diego';

/* DISPLAY FUNCTIONS */

// This function shows our actual weather screen after the landing screen prompt has been submitted
function showWeatherScreen() {
    document.getElementById('landing-page').style.display = 'none';
    document.querySelector('.weather-content').style.display = 'flex';
    document.getElementById('city-search-form-weather').style.display = 'flex';
    document.getElementById('weather-screen').style.display = 'flex';
    document.getElementById('hourly-weather').style.display = 'flex';
    document.getElementById('weekly-forecast').style.display = 'block'; // Re-address after we have styled the weekly forecast (in case we use flexbox)
    document.querySelector('.main-container').style.overflowY = 'auto'; // This allows for scrolling once weather screen shows
}

function displayWeatherData(data) {
    document.getElementById('current-location').style.display = 'none';
    document.getElementById('city-name').textContent = data.name;
    document.getElementById('temp-number').innerHTML = Math.round(data.main.temp) + '<span class="degree">º</span>';
    document.getElementById('weather-description').textContent = data.weather[0].description;
        let description = data.weather[0].description;
        let capitalized = description.charAt(0).toUpperCase() + description.slice(1);
        document.getElementById('weather-description').textContent = capitalized;
    document.getElementById('feels-like-value').textContent = Math.round(data.main.feels_like) + "º";
    document.getElementById('high').innerHTML = Math.round(data.main.temp_max) + "º";
    document.getElementById('low').innerHTML = Math.round(data.main.temp_min) + "º";
};

function displayHighLow(data) {
    let today = new Date().toLocaleDateString('en-US');

    let todayTemps = data.list
    .filter(item => new Date(item.dt * 1000).toLocaleDateString('en-US' === today))
    .map(item => item.main.temp);

    let todayHigh = Math.round(Math.max(...todayTemps));
    let todayLow = Math.round(Math.min(...todayTemps));

    document.getElementById('high').innerHTML = todayHigh + "º";
    document.getElementById('low').innerHTML = todayLow + "º";
}

function displayHourlyForecast(data) {
    document.getElementById('hourly-weather').innerHTML = ''; // Resets the information everytime a reload begins
    
    // Data loop to grab info from each item from 0-8 inside our data.list
    // Why 8? Because that's the specific data we need
    data.list.slice(0, 16).forEach(item => { 
        let dateObject = new Date(item.dt * 1000); // Creates a date * 1000 to make it 
        let hour = dateObject.getHours();
        let ampm = hour >= 12 ? 'pm' : 'am';
        let hour12 = hour % 12 || 12;
        let formattedHour = hour12 + ampm;
        let card = document.createElement('div');
        document.getElementById('hourly-weather').appendChild(card);
        card.classList.add('hour-card');
        card.innerHTML = 
            `<p>${formattedHour}</p>
            <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" alt="weather icon"/>
            <p>${Math.round(item.main.temp)}º</p>`;

    });
}

function displayWeeklyForecast(data) {
    document.getElementById('weekly-forecast').innerHTML = '';

    let days = {}

    data.list.forEach(item => {
        let dayName = new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' });

        if (!days[dayName]) {
            days[dayName] = [];
        }

        days[dayName].push(item);
    });

    let allMinTemps = data.list.map(item => item.main.temp_min);
    let allMaxTemps = data.list.map(item => item.main.temp_max);

    let overallMinTemp = Math.min(...allMinTemps);
    let overallMaxTemp = Math.max(...allMaxTemps);

    Object.keys(days).forEach(dayName => {
        // Find temperature mins/maxs of all temps
        let dayTempsMin = days[dayName].map(item => item.main.temp_min);
        let dayTempsMax = days[dayName].map(item => item.main.temp_max);

        // Find temperature mins/maxs of each day
        let dayMin = Math.min(...dayTempsMin);
        let dayMax = Math.max(...dayTempsMax);

        // Find % of left margin from bar fill in and entire bar
        let leftPercent = ((dayMin - overallMinTemp) / (overallMaxTemp - overallMinTemp)) * 100;
        let widthPercent = ((dayMax - dayMin) / (overallMaxTemp - overallMinTemp)) * 100;
        
        // Grabbing the icon from the data pull
        let dayIcon = days[dayName][0].weather[0].icon;

        // Creating the div and displaying the info
        let row = document.createElement('div');
        row.classList.add('day-row');
        row.innerHTML = `
            <p class="day-name">${dayName}</p>
            <img src="https://openweathermap.org/img/wn/${dayIcon}@2x.png" alt="weather icon"/>
            <p class="day-low">${Math.round(dayMin)}º</p>
            <div class="temp-bar">
                <div class="temp-fill" style="margin-left: ${leftPercent}%; width: ${widthPercent}%;"></div>
            </div>
            <p class="day-high">${Math.round(dayMax)}º</p>
            `;
            document.getElementById('weekly-forecast').appendChild(row);
        console.log(dayName, dayMin, dayMax);
    });


    console.log(overallMinTemp, overallMaxTemp);
    console.log(days);
}

    

/* FETCH FUNCTIONS */

function getWeather(city) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=imperial`)
    .then (response => response.json())
    .then (data => {
        if (data.cod === 200) {
            document.getElementById('error-message-landing').textContent = "";
            document.getElementById('error-message-weather').textContent = "";
            displayWeatherData(data);
            showWeatherScreen();
        } else {
            document.getElementById('error-message-landing').textContent = "Error, invalid city, please enter a valid city name.";
            document.getElementById('error-message-weather').textContent = "Error, invalid city, please enter a valid city name.";
    }});
}

function getCurrentLocationWeather() {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            let lat = position.coords.latitude;
            let lon = position.coords.longitude
            fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`)
            .then (response => response.json())
            .then (data => {
                displayWeatherData(data);
                getCurrentLocationHourlyWeather(lat, lon);
                getCurrentLocationWeeklyForecast(lat, lon);
                showWeatherScreen();
                document.getElementById('current-location').style.display = 'block';
            });
        },
        (error) => {
            console.log('Location denied, falling back to San Diego');
            getWeather('San Diego');
            getHourlyForecast('San Diego');
            getWeeklyForecast('San Diego');
        }
    );
}

function getCurrentLocationHourlyWeather(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`)
    .then (response => response.json())
    .then (data => {
        displayHourlyForecast(data);
    });
}

function getCurrentLocationWeeklyForecast(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`)
    .then (response => response.json())
    .then (data => {
        if (data.cod === "200") {
            document.getElementById('error-message-landing').textContent = "";
            displayWeeklyForecast(data);
        } else {
            document.getElementById('error-message-landing').textContent = "Error, invalid city, please enter a valid city name.";
        }
    });    
}

function getHourlyForecast(city) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=imperial`)
    .then (response => response.json())
    .then (data => {
        if (data.cod === "200") {
            document.getElementById('error-message-landing').textContent = "";
            displayHourlyForecast(data);
            displayHighLow(data); // Uses this data to populate inside of displayHighLow();
        } else {
            document.getElementById('error-message-landing').textContent = "Error, invalid city, please enter a valid city name.";
    }});
}

function getWeeklyForecast(city) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=imperial`)
    .then (response => response.json())
    .then (data => {
        if (data.cod === "200") {
            document.getElementById('error-message-landing').textContent = "";
            displayWeeklyForecast(data);
        } else {
            document.getElementById('error-message-landing').textContent = "Error, invalid city, please enter a valid city name.";
        }
    });    
}



/* EVENT LISTENERS */

// Event Listener for landing page search bar
document.getElementById('city-search-form-landing').addEventListener('submit', (event) => {
    event.preventDefault();
    let searchCity = document.getElementById('search-bar-landing').value;
    getWeather(searchCity);
    getHourlyForecast(searchCity);
    getWeeklyForecast(searchCity);
});


document.getElementById('city-search-form-weather').addEventListener('submit', (event) => {
    event.preventDefault();
    let searchCity = document.getElementById('search-bar-weather').value;
    getWeather(searchCity);
    getHourlyForecast(searchCity);
    getWeeklyForecast(searchCity);
});

document.getElementById('popular-cities').addEventListener('click', (event) => {
    if (event.target.classList.contains('city-btn')) {
        let city = event.target.textContent;
        getWeather(city);
        getHourlyForecast(city);
        getWeeklyForecast(city);
    };
});

/* DRAG TO SCROLL */

const hourlyWeather = document.getElementById('hourly-weather');
let isDown = false;
let startX;
let scrollLeft;

// Mouse down
hourlyWeather.addEventListener('mousedown', (e) => {
    isDown = true;
    hourlyWeather.classList.add('active');
    startX = e.pageX - hourlyWeather.offsetLeft;
    scrollLeft = hourlyWeather.scrollLeft;
});

// Mouse has left the hourlyweather div
hourlyWeather.addEventListener('mouseleave', () => {
    isDown = false;
    hourlyWeather.classList.remove('active');
});

// Mouse no longer pressed down
hourlyWeather.addEventListener('mouseup', () => {
    isDown = false;
    hourlyWeather.classList.remove('active');
});

hourlyWeather.addEventListener('mousemove', (e) => {
    if (!isDown) return; // if no mouse is down, nothing happens
    e.preventDefault();
    let x = e.pageX - hourlyWeather.offsetLeft;
    let walk = (x - startX) * 1.5;
    hourlyWeather.scrollLeft = scrollLeft - walk;
});

/* INITIAL FUNCTION CALLS */

// getCurrentLocationWeather();

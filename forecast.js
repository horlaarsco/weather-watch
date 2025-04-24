$(document).ready(() => {
  const apiKey = 'ca7fa4eea17f1ddca4179ea69c71470b'
  let currentLat = null
  let currentLon = null
  let currentCity = null

  function formatDate(timestamp) {
    const date = new Date(timestamp * 1000)
    const day = date.getDate()
    const month = date.getMonth() + 1
    return `${day}/${month}`
  }

  function getDayName(timestamp) {
    const date = new Date(timestamp * 1000)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[date.getDay()]
  }

  function setWeatherIcon(weatherCode) {
    let iconClass

    if (weatherCode >= 200 && weatherCode < 300) {
      iconClass = 'fas fa-bolt'
    } else if (weatherCode >= 300 && weatherCode < 400) {
      iconClass = 'fas fa-cloud-rain'
    } else if (weatherCode >= 500 && weatherCode < 600) {
      iconClass = 'fas fa-cloud-showers-heavy'
    } else if (weatherCode >= 600 && weatherCode < 700) {
      iconClass = 'fas fa-snowflake'
    } else if (weatherCode >= 700 && weatherCode < 800) {
      iconClass = 'fas fa-smog'
    } else if (weatherCode === 800) {
      iconClass = 'fas fa-sun'
    } else if (weatherCode > 800) {
      iconClass = 'fas fa-cloud'
    } else {
      iconClass = 'fas fa-question'
    }

    return iconClass
  }

  function processForecastData(forecastData) {
    const processedData = []
    const dailyData = {}

    forecastData.list.forEach((item) => {
      const date = new Date(item.dt * 1000).toDateString()

      if (!dailyData[date] || new Date(item.dt * 1000).getHours() === 12) {
        dailyData[date] = item
      }
    })

    Object.values(dailyData)
      .slice(0, 5)
      .forEach((item) => {
        processedData.push({
          day: getDayName(item.dt),
          date: formatDate(item.dt),
          temp: Math.round(item.main.temp),
          tempMin: Math.round(item.main.temp_min),
          tempMax: Math.round(item.main.temp_max),
          description: item.weather[0].description,
          icon: setWeatherIcon(item.weather[0].id),
          weatherId: item.weather[0].id,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
          pop: item.pop ? Math.round(item.pop * 100) : 0,
        })
      })

    return processedData
  }


  function renderForecast(forecastData) {
    const forecastContainer = $('#forecast-container')
    forecastContainer.empty()

    forecastData.forEach((day) => {
      const forecastItem = `
        <div class="col forecast-item" role="listitem" aria-label="Forecast for ${day.day}">
          <div class="forecast-day">${day.day}</div>
          <div class="forecast-date">${day.date}</div>
          <div class="forecast-icon">
            <i class="${day.icon}" aria-hidden="true"></i>
            <span class="visually-hidden">${day.description}</span>
          </div>
          <div class="forecast-temp">${day.temp}°C</div>
          <div class="forecast-description">${day.description}</div>
          <div class="forecast-details mt-2">
            <div><i class="fas fa-temperature-high text-primary" aria-hidden="true"></i> ${day.tempMax}°C</div>
            <div><i class="fas fa-temperature-low text-primary" aria-hidden="true"></i> ${day.tempMin}°C</div>
            <div><i class="fas fa-tint text-primary" aria-hidden="true"></i> ${day.pop}%</div>
          </div>
        </div>
      `
      forecastContainer.append(forecastItem)
    })

    $('#forecast-card').removeClass('d-none')

    createPrecipitationForecast(forecastData)
  }

  function createPrecipitationForecast(forecastData) {
    const precipitationContainer = $('#precipitation-container')
    precipitationContainer.empty()

    forecastData.forEach((day) => {
      let precipIcon = 'fas fa-sun'
      let precipText = 'No precipitation expected'

      if (day.pop >= 70) {
        precipIcon = 'fas fa-cloud-showers-heavy'
        precipText = 'Heavy precipitation likely'
      } else if (day.pop >= 40) {
        precipIcon = 'fas fa-cloud-rain'
        precipText = 'Precipitation likely'
      } else if (day.pop >= 20) {
        precipIcon = 'fas fa-cloud-sun-rain'
        precipText = 'Slight chance of precipitation'
      }

      const precipItem = `
        <div class="col-md-4 col-sm-6 mb-3">
          <div class="precipitation-item">
            <div class="precipitation-day">${day.day}, ${day.date}</div>
            <div class="precipitation-icon">
              <i class="${precipIcon}" aria-hidden="true"></i>
            </div>
            <div class="precipitation-probability">
              <div class="progress mb-2" style="height: 10px;">
                <div class="progress-bar bg-primary" role="progressbar" style="width: ${day.pop}%;" 
                  aria-valuenow="${day.pop}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
              <div class="precipitation-amount">${day.pop}% chance</div>
            </div>
            <div class="precipitation-text mt-2">${precipText}</div>
          </div>
        </div>
      `

      precipitationContainer.append(precipItem)
    })

    $('#precipitation-card').removeClass('d-none')
  }

  function loadForecastData(lat, lon, city) {
    if (city) {
      $('#forecast-location-text').html(`Showing forecast for <strong>${city}</strong>`)
    } else {
      $('#forecast-location-text').html(`Showing forecast for your location`)
    }

    $('#forecast-card, #precipitation-card').addClass('d-none')
    $('#forecast-loading').removeClass('d-none')

    $.ajax({
      url: `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`,
      method: 'GET',
      dataType: 'json',
      success: (data) => {
        const processedData = processForecastData(data)
        renderForecast(processedData)

        $('#forecast-loading').addClass('d-none')
      },
      error: (xhr) => {
        console.error('Error fetching forecast data:', xhr.responseText)
        $('#forecast-loading').addClass('d-none')
        $('#forecast-error-message')
          .removeClass('d-none')
          .text('Error loading forecast data. Please try again.')
      },
    })

  }

  function getForecastByCity(city) {
    $(
      '#forecast-card, #precipitation-card'
    ).addClass('d-none')
    $('#forecast-error-message').addClass('d-none')
    $('#forecast-loading').removeClass('d-none')

    $.ajax({
      url: `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`,
      method: 'GET',
      dataType: 'json',
      success: (data) => {
        currentLat = data.coord.lat
        currentLon = data.coord.lon
        currentCity = data.name

        sessionStorage.setItem('weatherLat', data.coord.lat)
        sessionStorage.setItem('weatherLon', data.coord.lon)
        sessionStorage.setItem('weatherCity', data.name)

        loadForecastData(data.coord.lat, data.coord.lon, data.name)
      },
      error: (xhr) => {
        $('#forecast-loading').addClass('d-none')

        $('#forecast-error-message')
          .removeClass('d-none')
          .text(`City "${city}" not found. Please try another location.`)

        console.error('Error fetching weather data:', xhr.responseText)
      },
    })
  }

  function getCurrentLocation() {
    if (navigator.geolocation) {
      $('#forecast-loading').removeClass('d-none')

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lon = position.coords.longitude

          currentLat = lat
          currentLon = lon

          sessionStorage.setItem('weatherLat', lat)
          sessionStorage.setItem('weatherLon', lon)

          loadForecastData(lat, lon, null)
        },
        (error) => {
          $('#forecast-loading').addClass('d-none')
          console.error('Geolocation error:', error)
          $('#forecast-location-text').text(
            'Location access denied. Showing forecast for Barking, London.'
          )
          getForecastByCity('Barking, London')
        }, {
          timeout: 10000
        }
      )
    } else {
      console.error('Geolocation is not supported by this browser')
      $('#forecast-location-text').text(
        'Location detection not supported. Showing forecast for Barking, London.'
      )
      getForecastByCity('Barking, London')
    }
  }

  const storedLat = sessionStorage.getItem('weatherLat')
  const storedLon = sessionStorage.getItem('weatherLon')
  const storedCity = sessionStorage.getItem('weatherCity')

  if (storedLat && storedLon) {
    loadForecastData(storedLat, storedLon, storedCity)
  } else {
    getCurrentLocation()
  }

  $('#forecast-search-form').on('submit', (e) => {
    e.preventDefault()

    const city = $('#forecast-city-input').val().trim()

    if (city) {
      $('#forecast-location-text').text(`Searching for "${city}"...`)
      getForecastByCity(city)
    }
  })
})
$(document).ready(() => {
  const apiKey = 'ca7fa4eea17f1ddca4179ea69c71470b'

  let currentLat = null
  let currentLon = null
  let currentCity = null

  function getCurrentDate() {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date())

  }

  function formatTime(timestamp) {
    const date = new Date(timestamp * 1000)
    let hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'

    hours = hours % 12
    hours = hours ? hours : 12

    return `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`
  }

  function calculateDayLength(sunrise, sunset) {
    const dayLengthSeconds = sunset - sunrise
    const hours = Math.floor(dayLengthSeconds / 3600)
    const minutes = Math.floor((dayLengthSeconds % 3600) / 60)
    return `${hours} hours ${minutes} minutes`
  }

  function calculateDayProgress(sunrise, sunset) {
    const now = Math.floor(Date.now() / 1000)
    const dayLength = sunset - sunrise

    if (now < sunrise) return 0
    if (now > sunset) return 100

    const elapsed = now - sunrise
    return Math.round((elapsed / dayLength) * 100)
  }

  function setWeatherIcon(weatherCode) {
    let iconClass
    let iconDescription

    if (weatherCode >= 200 && weatherCode < 300) {
      iconClass = 'fas fa-bolt'
      iconDescription = 'Thunderstorm'
    } else if (weatherCode >= 300 && weatherCode < 400) {
      iconClass = 'fas fa-cloud-rain'
      iconDescription = 'Drizzle'
    } else if (weatherCode >= 500 && weatherCode < 600) {
      iconClass = 'fas fa-cloud-showers-heavy'
      iconDescription = 'Rain'
    } else if (weatherCode >= 600 && weatherCode < 700) {
      iconClass = 'fas fa-snowflake'
      iconDescription = 'Snow'
    } else if (weatherCode >= 700 && weatherCode < 800) {
      iconClass = 'fas fa-smog'
      iconDescription = 'Foggy conditions'
    } else if (weatherCode === 800) {
      iconClass = 'fas fa-sun'
      iconDescription = 'Clear sky'
    } else if (weatherCode > 800) {
      iconClass = 'fas fa-cloud'
      iconDescription = 'Cloudy'
    } else {
      iconClass = 'fas fa-question'
      iconDescription = 'Unknown weather condition'
    }

    $('#weather-icon-description').text(iconDescription)

    return iconClass
  }

  function getWeatherByCoords(lat, lon, isCurrentLocation = false) {
    currentLat = lat
    currentLon = lon

    sessionStorage.setItem('weatherLat', lat)
    sessionStorage.setItem('weatherLon', lon)

    $('#weather-card').addClass('d-none')
    $('#sun-moon-card').addClass('d-none')
    $('#error-message').addClass('d-none')
    $('#loading').removeClass('d-none')

    $.ajax({
      url: `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`,
      method: 'GET',
      dataType: 'json',
      success: (data) => {
        currentCity = data.name
        sessionStorage.setItem('weatherCity', data.name)

        $('#loading').addClass('d-none')

        $('#city-name').text(data.name + ', ' + data.sys.country)
        $('#date').text(getCurrentDate())
        $('#temperature').text(Math.round(data.main.temp) + '°C')
        $('#description').text(data.weather[0].description)
        $('#feels-like').text(Math.round(data.main.feels_like) + '°C')
        $('#humidity').text(data.main.humidity + '%')
        $('#wind-speed').text(data.wind.speed + ' m/s')

        $('#weather-icon').attr(
          'class',
          setWeatherIcon(data.weather[0].id) + ' display-1 text-primary'
        )

        if (isCurrentLocation) {
          $('#location-text').html(
            `You're in <strong>${data.name}</strong>! It's currently <strong>${
              data.weather[0].description
            }</strong> with a temperature of <strong>${Math.round(data.main.temp)}°C</strong>.`
          )
        } else {
          $('#location-text').html(`Showing weather for <strong>${data.name}</strong>`)
        }

        $('#weather-card').removeClass('d-none')

        const sunriseTime = formatTime(data.sys.sunrise)
        const sunsetTime = formatTime(data.sys.sunset)
        const dayLength = calculateDayLength(data.sys.sunrise, data.sys.sunset)
        const dayProgress = calculateDayProgress(data.sys.sunrise, data.sys.sunset)

        $('#sunrise-time').text(sunriseTime)
        $('#sunset-time').text(sunsetTime)
        $('#day-length').text(dayLength)
        $('#day-progress').css('width', `${dayProgress}%`).attr('aria-valuenow', dayProgress)

        $('#sun-moon-card').removeClass('d-none')
      },
      error: (xhr) => {
        $('#loading').addClass('d-none')

        $('#error-message').removeClass('d-none')
        $('#location-text').text('Unable to get weather data. Please try searching for a city.')
        console.error('Error fetching weather data:', xhr.responseText)
      },
    })
  }

  function getWeatherByCity(city) {
    $('#weather-card').addClass('d-none')
    $('#sun-moon-card').addClass('d-none')
    $('#error-message').addClass('d-none')
    $('#loading').removeClass('d-none')

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

        $('#loading').addClass('d-none')

        $('#city-name').text(data.name + ', ' + data.sys.country)
        $('#date').text(getCurrentDate())
        $('#temperature').text(Math.round(data.main.temp) + '°C')
        $('#description').text(data.weather[0].description)
        $('#feels-like').text(Math.round(data.main.feels_like) + '°C')
        $('#humidity').text(data.main.humidity + '%')
        $('#wind-speed').text(data.wind.speed + ' m/s')

        $('#weather-icon').attr(
          'class',
          setWeatherIcon(data.weather[0].id) + ' display-1 text-primary'
        )

        $('#location-text').html(`Showing weather for <strong>${data.name}</strong>`)

        $('#weather-card').removeClass('d-none')

        const sunriseTime = formatTime(data.sys.sunrise)
        const sunsetTime = formatTime(data.sys.sunset)
        const dayLength = calculateDayLength(data.sys.sunrise, data.sys.sunset)
        const dayProgress = calculateDayProgress(data.sys.sunrise, data.sys.sunset)

        $('#sunrise-time').text(sunriseTime)
        $('#sunset-time').text(sunsetTime)
        $('#day-length').text(dayLength)
        $('#day-progress').css('width', `${dayProgress}%`).attr('aria-valuenow', dayProgress)

        $('#sun-moon-card').removeClass('d-none')
      },
      error: (xhr) => {
        $('#loading').addClass('d-none')

        $('#error-message').removeClass('d-none')
        $('#location-text').text(`City "${city}" not found. Please try another location.`)
        console.error('Error fetching weather data:', xhr.responseText)
      },
    })
  }

  function getCurrentLocation() {
    if (navigator.geolocation) {
      $('#loading').removeClass('d-none')

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lon = position.coords.longitude

          currentLat = lat
          currentLon = lon

          getWeatherByCoords(lat, lon, true)
        },
        (error) => {
          $('#loading').addClass('d-none')
          console.error('Geolocation error:', error)
          $('#location-text').text('Location access denied. Showing weather for Barking, London.')
          getWeatherByCity('Barking, London')
        }, {
          timeout: 10000
        }
      )
    } else {
      console.error('Geolocation is not supported by this browser')
      $('#location-text').text('Location detection not supported. Showing weather for Barking, London.')
      getWeatherByCity('Barking, London')
    }
  }

  const storedLat = sessionStorage.getItem('weatherLat')
  const storedLon = sessionStorage.getItem('weatherLon')
  const storedCity = sessionStorage.getItem('weatherCity')

  if (storedLat && storedLon) {
    getWeatherByCoords(storedLat, storedLon)
    $('#location-text').html(
      `Showing weather for <strong>${storedCity || 'your location'}</strong>`
    )
  } else {
    getCurrentLocation()
  }

  $('#search-form').on('submit', (e) => {
    e.preventDefault()

    const city = $('#city-input').val().trim()

    if (city) {
      $('#location-text').text(`Searching for "${city}"...`)
      getWeatherByCity(city)
    }
  })
})
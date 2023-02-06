'use strict';

////////////////////////////Classes/////////////////////////////////////////
class Hangout {
  date = new Date();
  id = String(Date.now()).slice(-10);
  clicks = 0;

  constructor(coords, placeName, directions, grade) {
    this.coords = coords;
    this.placeName = placeName;
    this.directions = directions;
    this.grade = grade;
  }
  _setDescription() {
    // prettier-ignore
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} - "${this.placeName}" : ${this.directions}`;
  }
  click() {
    this.clicks++;
  }
}

class Coffee extends Hangout {
  type = 'coffee';
  constructor(coords, placeName, directions, grade) {
    super(coords, placeName, directions, grade);
    this._setDescription();
  }
}

class Lookout extends Hangout {
  type = 'lookout';
  constructor(coords, placeName, directions, grade) {
    super(coords, placeName, directions, grade);
    this._setDescription();
  }
}

///////////////////////////App Architecture///////////////////////////////
//Elements Selection
const form = document.querySelector('.form');
const formHelper = document.querySelector('.form-helper-hide');
const containerHangouts = document.querySelector('.hangouts');
const inputType = document.querySelector('.form__input--type');
const inputName = document.querySelector('.form__input--name');
const inputDirections = document.querySelector('.form__input--directions');
const inputGrade = document.querySelector('.form__input--grade');

class App {
  #map;
  #mapEvent;
  #HangOutsArr = [];
  constructor() {
    // Code in Constructor Executed When page loads.

    // get User's current position
    this._getPosition();

    // get Local storage
    this._getLocalStorage();

    // Attach Event Handlers
    form.addEventListener('submit', this._newHangout.bind(this));
    containerHangouts.addEventListener('click', this._moveToMarker.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Sorry, we could not get your position');
        },
        { enableHighAccuracy: true }
      );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 13);

    //Default Map
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //Show Form on Click /
    this.#map.on('click', this._showForm.bind(this));

    this.#HangOutsArr.forEach(hangout => {
      this._renderHangoutMarker(hangout);
    });
  }

  _showForm(mapE) {
    // assign mapE to global mapEvent
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    formHelper.classList.remove('form-helper-hide');
  }

  _toggleElevationField() {}

  _newHangout(e) {
    e.preventDefault();
    // Get Form data
    const type = inputType.value;
    const placeName = inputName.value;
    const directions = inputDirections.value;
    const grade = +inputGrade.value;
    const { lat, lng } = this.#mapEvent.latlng;
    const lat_lng_arr = [lat, lng];
    let hangoutObj;

    // Data Validation And Create OBJ (coffee/lookout)
    if (type === 'coffee') {
      if (!/^[a-zA-Z]*$/g.test(placeName, directions))
        return alert('Must be a Valid Text');
      if (!Number(grade)) return alert('Must Be a Valid Number');
      if (!grade <= 10 && !grade > 0) {
        return alert('Your input must be between 1-10');
      }
      hangoutObj = new Coffee(lat_lng_arr, placeName, directions, grade);
    }

    if (type === 'lookout') {
      if (!/^[a-zA-Z]*$/g.test(placeName, directions))
        return alert('Must be a Valid Text');
      if (!Number(grade)) return alert('Must Be a Valid Number');
      if (!grade <= 10 && !grade > 0) {
        return alert('Your input must be between 1-10');
      }
      hangoutObj = new Lookout(lat_lng_arr, placeName, directions, grade);
    }
    //add new OBJ to Arr
    this.#HangOutsArr.push(hangoutObj);

    //Render Hangout Marker
    this._renderHangoutMarker(hangoutObj);

    //Render Hangout On list
    this._renderHangout(hangoutObj);

    //clear inputs
    inputType.value = '';
    inputName.value = '';
    inputDirections.value = '';
    inputGrade.value = '';
    form.classList.add('hidden');
    formHelper.classList.add('form-helper-hide');

    //(DB)  Set local storage for all Hangouts (DB)
    this._setLocalStorage();
  }
  //Render Workout on Map as Marker
  _renderHangoutMarker(hangoutObj) {
    L.marker(hangoutObj.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 200,
          autoClose: false,
          closeOnClick: false,
          className: `${hangoutObj.type}-popup`,
        })
      )
      .setPopupContent(
        `${hangoutObj.type === 'coffee' ? ' Coffee Place ☕' : 'Lookout 🌅'}`
      )
      .openPopup();
  }

  _renderHangout(hangoutObj) {
    const time = hangoutObj.date;
    const html = `
    
    <li class="hangout hangout--${hangoutObj.type}" data-id="${hangoutObj.id}">
    
    <div class="hangout__details">
      <span class="hangout__icon">${
        hangoutObj.type === 'coffee' ? '☕' : '🌅'
      }</span>

      <span class="hangout__value">${new Date(time).toLocaleDateString(
        'en-US'
      )}</span>
    </div>
    <div class="hangout__details">
      <span class="hangout__icon">👍</span>
      <span class="hangout__unit">Grade:</span>
      <span class="hangout__value">${hangoutObj.grade}</span>
      <span class="delete">&times;</span>
     
    </div>
    <h2 class="hangout__title">${hangoutObj.description}</h2>
    `;
    // push the HTML to the page
    form.insertAdjacentHTML('afterend', html);
    const close = document.querySelector('.delete');

    close.addEventListener('click', this.deleteHangout.bind(this));
  }

  _moveToMarker(e) {
    const hangoutEl = e.target.closest('.hangout');

    if (!hangoutEl) return;

    const hangout = this.#HangOutsArr.find(
      hang => hang.id === hangoutEl.dataset.id
    );
    this.#map.setView(hangout.coords, 13, {
      animate: true,
      pan: { duration: 1 },
    });
    // using the public interface
    // hangout.click();
  }

  _setLocalStorage() {
    localStorage.setItem('hangouts', JSON.stringify(this.#HangOutsArr));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('hangouts'));
    if (!data) return;
    this.#HangOutsArr = data;

    this.#HangOutsArr.forEach(hangout => {
      this._renderHangout(hangout);
    });
  }

  deleteHangout(e) {
    // From Page
    const hangoutEL = document.querySelector('.hangout');

    hangoutEL.remove();
    // From Storage
  }

  reset() {
    localStorage.removeItem('hangouts');
    location.reload();
  }
}

const app = new App();
// app.reset();

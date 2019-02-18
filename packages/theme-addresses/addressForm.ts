import {loadCountries, Country} from './loader';
import { FromEventTarget } from 'rxjs/internal/observable/fromEvent';

var COUNTRIES: Country[];
var FIELD_REGEXP = /({\w+})/g;
var LINE_DELIMITER = '_';
var INPUT_SELECTORS = {
  lastName: '[name="address[last_name]"]',
  firstName: '[name="address[first_name]"]',
  company: '[name="address[company]"]',
  address1: '[name="address[address1]"]',
  address2: '[name="address[address2]"]',
  country: '[name="address[country]"]',
  zone: '[name="address[province]"]',
  postalCode: '[name="address[zip]"]',
  city: '[name="address[city]"]',
  phone: '[name="address[phone]"]',
};

interface FormElement {
  wrapper?: HTMLElement;
  input?: HTMLInputElement | HTMLSelectElement;
  labels?: HTMLElement;
}

interface FormElements {
  lastName?: FormElement;
  firstName?: FormElement;
  company?: FormElement;
  address1?: FormElement;
  address2?: FormElement;
  country?: FormElement;
  zone?: FormElement;
  postalCode?: FormElement;
  city?: FormElement;
  phone?: FormElement;
}

interface AddressFormOptions {
  loaded?(): void;
}

export default function AddressForm(
  rootEl: HTMLElement,
  locale: string = 'en',
  options: AddressFormOptions = {},
) {
  var formElements = loadFormElements(rootEl);
  validateElements(formElements);

  if (COUNTRIES) {
    init(rootEl, formElements, options);
  } else {
    loadCountries(locale).then(function(countries) {
      COUNTRIES = countries;
      init(rootEl, formElements, options);
    });
  }
}

/**
 * Runs when countries have been loaded
 */
function init(rootEl: HTMLElement, formElements: FormElements, options: AddressFormOptions) {
  populateCountries(formElements);
  var selectedCountry = formElements.country.input
    ? formElements.country.input.value
    : null;
  handleCountryChange(rootEl, formElements, selectedCountry);
  if (options.loaded) {
    options.loaded();
  }
}

/**
 * Handles when a country change: set labels, reorder fields, populate zones
 */
function handleCountryChange(rootEl: HTMLElement, formElements: FormElements, countryCode: string) {
  var country = getCountry(countryCode);

  setEventListeners(rootEl, formElements, country);
  setLabels(formElements, country);
  reorderFields(rootEl, formElements, country);
  populateZones(formElements, country);
}

/**
 * Sets up event listener for country change
 */
function setEventListeners(rootEl: HTMLElement, formElements: FormElements, country: Country) {
  formElements.country.input.addEventListener('change', function(event) {
    handleCountryChange(rootEl, formElements, (event.target as HTMLSelectElement).value);
  });
}

/**
 * Reorder fields in the DOM and add data-attribute to fields given a country
 */
function reorderFields(rootEl: HTMLElement, formElements: FormElements, country: Country) {
  var formFormat = country.formatting.edit;
  var rowIndex = 0;

  var countryWrapper = formElements.country.wrapper;
  var afterCountry = false;
  getOrderedField(formFormat).forEach(function(row) {
    row.forEach(function(line) {
      formElements[line].wrapper.dataset.lineCount = row.length;
      if (!formElements[line].wrapper) {
        return;
      }
      if (line === 'country') {
        afterCountry = true;
        return;
      }

      if (afterCountry) {
        rootEl.append(formElements[line].wrapper);
      } else {
        rootEl.insertBefore(formElements[line].wrapper, countryWrapper);
      }
    });
  });
}

/**
 * Update labels for a given country
 */
function setLabels(formElements: FormElements, country: Country) {
  Object.keys(formElements).forEach(function(formElementName) {
    formElements[formElementName].labels.forEach(function(label) {
      label.textContent = country.labels[formElementName];
    });
  });
}

/**
 * Add right countries in the dropdown for a given country
 */
function populateCountries(formElements: FormElements) {
  var countrySelect = formElements.country.input;

  COUNTRIES.forEach(function(country) {
    var optionElement = document.createElement('option');
    optionElement.value = country.code;
    optionElement.textContent = country.name;
    countrySelect.appendChild(optionElement);
  });

  if (countrySelect.dataset.default) {
    countrySelect.value = countrySelect.dataset.default;
  }
}

/**
 * Add right zones in the dropdown for a given country
 */
function populateZones(formElements: FormElements, country: Country) {
  var zoneEl = formElements.zone;
  if (!zoneEl) {
    return;
  }

  if (country.zones.length === 0) {
    zoneEl.wrapper.dataset.ariaHidden = 'true';
    zoneEl.input.innerHTML = '';
    return;
  }

  zoneEl.wrapper.dataset.ariaHidden = 'false';

  var zoneSelect = zoneEl.input;
  zoneSelect.innerHTML = '';

  country.zones.forEach(function(zone) {
    var optionElement = document.createElement('option');
    optionElement.value = zone.code;
    optionElement.textContent = zone.name;
    zoneSelect.appendChild(optionElement);
  });

  if (zoneSelect.dataset.default) {
    zoneSelect.value = zoneSelect.dataset.default;
  }

}

/**
 * Will throw if an input or a label is missing from the wrapper
 */
function validateElements(formElements) {
  Object.keys(formElements).forEach(function(elementKey) {
    var element = formElements[elementKey].input;
    var labels = formElements[elementKey].labels;

    if (!element) {
      return;
    }

    if (typeof element !== 'object') {
      throw new TypeError(
        formElements[elementKey] + ' is missing an input or select.'
      );
    } else if (typeof labels !== 'object') {
      throw new TypeError(formElements[elementKey] + ' is missing a label.');
    }
  });
}

/**
 * Given an countryCode (eg. 'CA'), will return the data of that country
 */
function getCountry(countryCode: string) {
  countryCode = countryCode || 'CA';
  return COUNTRIES.filter(function(country) {
    return country.code === countryCode;
  })[0];
}

/**
 * Given a format (eg. "{firstName}{lastName}_{company}_{address1}_{address2}_{city}_{country}{province}{zip}_{phone}")
 * will return an array of how the form needs to be formatted, eg.:
 * =>
 * [
 *   ['firstName', 'lastName'],
 *   ['company'],
 *   ['address1'],
 *   ['address2'],
 *   ['city'],
 *   ['country', 'province', 'zip'],
 *   ['phone']
 * ]
 */
function getOrderedField(format: string) {
  return format.split(LINE_DELIMITER).map(function(fields) {
    var result = fields.match(FIELD_REGEXP);
    if (!result) {
      return [];
    }

    return result.map(function(fieldName) {
      var newFieldName = fieldName.replace(/[{}]/g, '');

      switch (newFieldName) {
        case 'zip':
          return 'postalCode';
        case 'province':
          return 'zone';
        default:
          return newFieldName;
      }
    });
  });
}

/**
 * Given a rootEl where all `input`s, `select`s, and `labels` are nested, it
 * will returns all form elements (wrapper, input and labels) of the form.
 * See `FormElements` type for details
 */
function loadFormElements(rootEl: HTMLElement): FormElements {
  var elements: FormElements = {};
  Object.keys(INPUT_SELECTORS).forEach(function(inputKey) {
    var input = rootEl.querySelector(INPUT_SELECTORS[inputKey]);
    elements[inputKey] = input
      ? {
          wrapper: input.parentElement,
          input: input,
          labels: document.querySelectorAll('[for="' + input.id + '"]'),
        }
      : {};
  });

  return elements;
}

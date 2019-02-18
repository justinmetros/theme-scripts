/**
 * @jest-environment jsdom
 */
import 'isomorphic-fetch';

import fetchMock from 'fetch-mock';

import {AddressForm} from '../theme-addresses';

import formHtml from '../__fixtures__/form.html';
import countries from '../__fixtures__/countries.json';

describe('AddressForm', () => {
  let countrySelect;

  beforeAll(loaded => {
    document.body.innerHTML = formHtml;
    fetchMock.mock(
      'https://country-service.shopifycloud.com/graphql',
      countries
    );
    AddressForm(document.body.querySelector('[data-address="root"]'), 'en', {
      loaded,
    });
    countrySelect = document.body.querySelector('[name="address[country]"]');
  });

  test('use [data-default] country value if set in the DOM', () => {
    const provinceSelect = document.body.querySelector(
      '[name="address[province]"]'
    );

    expect(countrySelect.value).toEqual('JP');
    expect(provinceSelect.value).toEqual('JP-04');
  });

  test('reorders field correctly', () => {
    countrySelect.value = 'CA';
    countrySelect.dispatchEvent(new Event('change'));

    let inputs = [
      ...document.body.querySelectorAll('[data-address=root] [name^=address]'),
    ];
    let order = inputs.map(input => input.name);

    expect(order).toEqual([
      'address[first_name]',
      'address[last_name]',
      'address[company]',
      'address[address1]',
      'address[address2]',
      'address[city]',
      'address[country]',
      'address[province]',
      'address[zip]',
      'address[phone]',
    ]);

    countrySelect.value = 'FR';
    countrySelect.dispatchEvent(new Event('change'));

    inputs = [
      ...document.body.querySelectorAll('[data-address=root] [name^=address]'),
    ];
    order = inputs.map(input => input.name);
    expect(order).toEqual([
      'address[first_name]',
      'address[last_name]',
      'address[company]',
      'address[address1]',
      'address[address2]',
      'address[zip]',
      'address[city]',
      'address[country]',
      'address[province]',
      'address[phone]',
    ]);
  });

  test('replaces labels depending of the country', () => {
    const address2Label = document.body.querySelector(
      '[for="AddressAddress2"]'
    );

    countrySelect.value = 'CA';
    countrySelect.dispatchEvent(new Event('change'));
    expect(address2Label.textContent).toEqual('Apt./Unit No.');

    countrySelect.value = 'FR';
    countrySelect.dispatchEvent(new Event('change'));
    expect(address2Label.textContent).toEqual('Apartment, suite, etc.');
  });

  test('provinces are correctly populated depending of the country', () => {
    const provinceSelect = document.body.querySelector(
      '[name="address[province]"]'
    );

    countrySelect.value = 'CA';
    countrySelect.dispatchEvent(new Event('change'));
    expect(provinceSelect.value).toEqual('AB');

    countrySelect.value = 'US';
    countrySelect.dispatchEvent(new Event('change'));
    expect(provinceSelect.value).toEqual('AL');
  });

  test('provinces select is hidden if country does not have any', () => {
    const provinceWrapper = document.body.querySelector(
      '[data-province-wrapper]'
    );
    const provinceSelect = document.body.querySelector(
      '[name="address[province]"]'
    );

    countrySelect.value = 'FR';
    countrySelect.dispatchEvent(new Event('change'));
    expect(provinceWrapper.dataset.ariaHidden).toBeTruthy();
    expect(provinceSelect.options.length).toEqual(0);
  });
});

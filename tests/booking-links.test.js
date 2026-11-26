import assert from 'node:assert/strict';
import { test } from 'node:test';
import { site } from '../src/data/site.js';
import { easyweekLink } from '../src/lib/easyweek.js';

const oleh = site.team.find(({ slug }) => slug === 'oleh-dok');

test('a barber price row opens EasyWeek with that barber and that service', () => {
  const haircut = easyweekLink('oleh-dok', 'haircut');
  const scissors = easyweekLink('oleh-dok', 'scissors');
  assert.equal(haircut.choice, 'time');
  assert.match(haircut.url, new RegExp(`/team/303068/${oleh.easyweekId}/961628\\?`));
  assert.match(scissors.url, new RegExp(`/team/303068/${oleh.easyweekId}/967112\\?`));
  assert.notEqual(haircut.url, scissors.url, 'two services of one barber must not share a link');
});

test('a pair without a checked EasyWeek id falls back to the barber page', () => {
  const link = easyweekLink('liubov-zainchkovska', 'clipper');
  assert.equal(link.choice, 'service');
  assert.match(link.url, /\/team\/303068\/319649\?/);
});

test('a service with one id for every barber opens EasyWeek on it, the barber still to choose', () => {
  const link = easyweekLink(null, 'gray-head');
  assert.equal(link.choice, 'barber');
  assert.match(link.url, /\/strand\/303068\/961640\?/);
});

test('a service whose id differs per barber, or nothing chosen, opens the general page', () => {
  assert.deepEqual(easyweekLink(null, 'haircut'), { url: site.booking.externalUrl, choice: 'all' });
  assert.deepEqual(easyweekLink(), { url: site.booking.externalUrl, choice: 'all' });
});

test('every EasyWeek service id belongs to a service the barber offers on the site', () => {
  for (const [slug, ids] of Object.entries(site.booking.externalServices)) {
    assert.ok(site.team.some((member) => member.slug === slug), `${slug} is not on the team`);
    for (const serviceId of Object.keys(ids)) {
      const service = site.services.find(({ id }) => id === serviceId);
      assert.ok(service, `${serviceId} is not a service`);
      assert.ok(service.prices[slug] != null, `${slug} does not offer ${serviceId} on the site`);
    }
  }
});

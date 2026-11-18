import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTH_GATE_PROMPT_BILINGUAL,
  buildLoginUrlWithRedirect,
  getFabActionLabel,
  getRedirectRouteFromSearch,
  getRedirectTargetFromSearch,
  getTargetForDrawerSection,
  getTargetForRoute,
  isProtectedFeatureRoute,
  preserveRedirectOnAuthRoute,
  resolvePostLoginRoute,
} from './authRedirect';

test('isProtectedFeatureRoute gates all inner feature routes while keeping home, about & auth public', () => {
  assert.equal(isProtectedFeatureRoute('/'), false);
  assert.equal(isProtectedFeatureRoute('/about'), false);
  assert.equal(isProtectedFeatureRoute('/login'), false);
  assert.equal(isProtectedFeatureRoute('/register'), false);
  assert.equal(isProtectedFeatureRoute('/forgot-password'), false);
  assert.equal(isProtectedFeatureRoute('/admin/login'), false);

  assert.equal(isProtectedFeatureRoute('/eligibility'), true);
  assert.equal(isProtectedFeatureRoute('/universities'), true);
  assert.equal(isProtectedFeatureRoute('/ranking'), true);
  assert.equal(isProtectedFeatureRoute('/best-for-u'), true);
  assert.equal(isProtectedFeatureRoute('/notifications'), true);
  assert.equal(isProtectedFeatureRoute('/reports'), true);
  assert.equal(isProtectedFeatureRoute('/profile'), true);
  assert.equal(isProtectedFeatureRoute('/student/dashboard'), true);
  assert.equal(isProtectedFeatureRoute('/dashboard'), true);
});

test('getTargetForDrawerSection maps every drawer item to its exact route and tab', () => {
  assert.equal(getTargetForDrawerSection('home'), null);
  assert.equal(getTargetForDrawerSection('about'), null);

  const elig = getTargetForDrawerSection('eligibility');
  assert.equal(elig?.route, '/eligibility');
  assert.equal(elig?.section, 'eligibility');

  const ranking = getTargetForDrawerSection('ranking');
  assert.equal(ranking?.route, '/ranking');

  const bestForU = getTargetForDrawerSection('best-for-u');
  assert.equal(bestForU?.route, '/best-for-u');

  const univ = getTargetForDrawerSection('universities');
  assert.equal(univ?.route, '/universities');

  const notif = getTargetForDrawerSection('notifications');
  assert.equal(notif?.route, '/notifications');

  const reports = getTargetForDrawerSection('saved-reports');
  assert.equal(reports?.route, '/reports');
  assert.equal(reports?.profileTab, 'report');

  const profile = getTargetForDrawerSection('profile');
  assert.equal(profile?.route, '/profile');
  assert.equal(profile?.profileTab, 'profile');
});

test('getTargetForRoute reverses protected routes back to the exact drawer section', () => {
  assert.equal(getTargetForRoute('/'), null);
  assert.equal(getTargetForRoute('/about'), null);
  assert.equal(getTargetForRoute('/eligibility')?.section, 'eligibility');
  assert.equal(getTargetForRoute('/reports')?.profileTab, 'report');
  assert.equal(getTargetForRoute('/profile')?.profileTab, 'profile');
});

test('AUTH_GATE_PROMPT_BILINGUAL contains both English and Bangla login instructions', () => {
  assert.match(AUTH_GATE_PROMPT_BILINGUAL, /Please sign in to access this feature/);
  assert.match(AUTH_GATE_PROMPT_BILINGUAL, /এই ফিচারটি ব্যবহার করতে অনুগ্রহ করে লগইন করুন/);
});

test('getFabActionLabel resolves bilingual destination labels for both FAB actions', () => {
  assert.equal(getFabActionLabel('whatsapp').labelEn, 'Contact with Us (WhatsApp)');
  assert.equal(getFabActionLabel('career-finder').labelEn, 'Career & Subject Finder');
});

test('buildLoginUrlWithRedirect and getRedirectRouteFromSearch handle safe query redirects', () => {
  assert.equal(buildLoginUrlWithRedirect('/ranking'), '/login?redirect=/ranking');
  assert.equal(buildLoginUrlWithRedirect('/eligibility'), '/login?redirect=/eligibility');
  assert.equal(buildLoginUrlWithRedirect('/dashboard'), '/login?redirect=/student/dashboard');
  assert.equal(buildLoginUrlWithRedirect('/login'), '/login');
  assert.equal(buildLoginUrlWithRedirect('/admin/dashboard'), '/login');
  assert.equal(buildLoginUrlWithRedirect(null), '/login');

  assert.equal(getRedirectRouteFromSearch('?redirect=/ranking'), '/ranking');
  assert.equal(getRedirectRouteFromSearch('redirect=/best-for-u'), '/best-for-u');
  assert.equal(getRedirectRouteFromSearch('?redirect=/dashboard'), '/student/dashboard');
  assert.equal(getRedirectRouteFromSearch('?redirect=//evil.com'), null);
  assert.equal(getRedirectRouteFromSearch('?redirect=https://evil.com'), null);
  assert.equal(getRedirectRouteFromSearch('?redirect=/admin/dashboard'), null);
  assert.equal(getRedirectRouteFromSearch('?redirect=/login'), null);

  assert.equal(getRedirectTargetFromSearch('?redirect=/ranking')?.labelEn, 'University Ranking');
  assert.equal(preserveRedirectOnAuthRoute('/register', '?redirect=/ranking'), '/register?redirect=/ranking');
  assert.equal(preserveRedirectOnAuthRoute('/forgot-password', ''), '/forgot-password');
  assert.equal(resolvePostLoginRoute('?redirect=/notifications'), '/notifications');
  assert.equal(resolvePostLoginRoute(''), null);
});

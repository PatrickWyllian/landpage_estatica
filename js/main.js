// main.js


document.addEventListener('DOMContentLoaded', function(){
// mobile nav
const navToggle = document.getElementById('nav-toggle');
const siteNav = document.getElementById('site-nav');
navToggle.addEventListener('click', () => {
const open = siteNav.classList.toggle('open');
navToggle.setAttribute('aria-expanded', open);
});


// accordion
document.querySelectorAll('.accordion-btn').forEach(btn => {
btn.addEventListener('click', () => {
const expanded = btn.getAttribute('aria-expanded') === 'true';
btn.setAttribute('aria-expanded', String(!expanded));
const panel = btn.nextElementSibling;
if (panel) {
if (expanded) { panel.hidden = true; }
else { panel.hidden = false; }
}
});
});


// smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(a => {
a.addEventListener('click', function(e){
const href = this.getAttribute('href');
if (href.length > 1) {
e.preventDefault();
const el = document.querySelector(href);
if (el) {
const offset = 70; // header height
const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
window.scrollTo({top, behavior: 'smooth'});
// close mobile nav if open
if (siteNav.classList.contains('open')){
siteNav.classList.remove('open');
navToggle.setAttribute('aria-expanded', 'false');
}
}
}
});
});


// current year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
});
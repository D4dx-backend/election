const navItems = document.querySelectorAll(".li-items li");
const sections = document.querySelectorAll(".content");

navItems.forEach((item, index) => {
  item.addEventListener("click", () => {
    sections[index].scrollIntoView({ behavior: "smooth" });
    // Highlight the selected item
    navItems.forEach((navItem) => navItem.classList.remove("active"));
    item.classList.add("active");
  });
});

// Intersection Observer to highlight the current section in the navigation
const observerOptions = {
  root: null,
  rootMargin: "0px",
  threshold: 0.5,
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const index = Array.from(sections).indexOf(entry.target);
      navItems.forEach((navItem) => navItem.classList.remove("active"));
      navItems[index].classList.add("active");
    }
  });
}, observerOptions);

sections.forEach((section) => {
  observer.observe(section);
});

// Function to check if an element is in the viewport
function isAnyPartInViewport(element) {
  const rect = element.getBoundingClientRect();
  return rect.bottom > 0 && rect.right > 0 && rect.top < (window.innerHeight || document.documentElement.clientHeight) && rect.left < (window.innerWidth || document.documentElement.clientWidth);
}

function handleScroll() {
  const sections = document.getElementsByTagName("section");

  // Loop through all sections
  for (const section of sections) {
    if (isAnyPartInViewport(section)) {
      section.classList.add("show"); // Add the 'show' class when any part of the section is in the viewport
    }
  }
}

// Attach the scroll event listener
window.addEventListener("scroll", handleScroll);

// Initial check in case the sections are already in the viewport
handleScroll();

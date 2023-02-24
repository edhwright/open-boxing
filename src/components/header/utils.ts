export function changeTheme() {
	const theme = localStorage.getItem("theme");
	const root = document.documentElement;
	if (theme === "light") {
		root.classList.add("theme-dark");
		localStorage.setItem("theme", "dark");
	} else {
		root.classList.remove("theme-dark");
		localStorage.setItem("theme", "light");
	}
}

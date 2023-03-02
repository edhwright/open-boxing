<script lang="ts">
	import MenuButton from "./MenuButton.svelte";
	import { onMount, onDestroy } from "svelte";
	import { changeTheme } from "./utils";
	export let showMobileNav: boolean;

	let scrollY: number;
	let prevBodyPosition: string;
	let prevBodyWidth: string;

	onMount(() => disableScroll());
	onDestroy(() => enableScroll());

	const enableScroll = () => {
		document.body.style.position = prevBodyPosition || "";
		document.body.style.top = "";
		document.body.style.overflow = "";
		document.body.style.width = prevBodyWidth || "";
		window.scrollTo(0, scrollY);
	};

	const disableScroll = () => {
		scrollY = window.scrollY;
		prevBodyPosition = document.body.style.position;
		prevBodyWidth = document.body.style.width;
		document.body.style.position = "fixed";
		document.body.style.top = `-${scrollY}px`;
		document.body.style.overflow = "hidden";
		document.body.style.width = "100%";
	};
</script>

<nav class="nav">
	<MenuButton bind:showMobileNav />
	<ul class="nav__list">
		<li class="nav__item">
			<a class="nav__link" href="/data/">Data</a>
		</li>
		<li class="nav__item">
			<a class="nav__link" href="/articles/">Articles</a>
		</li>
		<li class="nav__item">
			<a class="nav__link" href="/api/">API</a>
		</li>
		<li class="nav__item">
			<a class="nav__link" href="/about/">About</a>
		</li>
	</ul>
	<button class="nav__button" on:click={() => changeTheme()}>
		<span class="nav--light">Turn dark mode on</span>
		<span class="nav--dark">Turn dark mode off</span>
	</button>
</nav>

<style>
	.nav {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.9);
		margin: 0;
		padding: 0;
		z-index: 9999;
	}

	.nav__list {
		/* margin: 32px 12px 20px 12px; */
		margin: 32px 0 20px 0;
		list-style-type: none;
		padding: 0;
	}

	.nav__item {
		/* border-bottom: 1px solid white; */
		height: 40px;
	}

	.nav__link {
		width: 100%;
		font-size: var(--font-size-medium);
		line-height: 40px;
		display: block;
		padding: 0 12px;
		color: white;
		text-decoration: none;
		/* border-bottom: 1px solid white; */
	}

	.nav__link:hover {
		text-decoration: underline;
	}

	.nav__item:hover {
		background-color: rgb(40, 40, 40);
	}

	.nav__button {
		margin: 0 0 0 12px;
		background-color: transparent;
		border: 0;
		color: white;
		height: 40px;
		width: 100%;
		margin: 0;
		text-align: left;
		padding: 0 12px;
	}

	.nav__button:hover {
		background-color: rgb(40, 40, 40);
		cursor: pointer;
	}

	.nav--dark {
		display: var(--dark-mode-display);
	}

	.nav--light {
		display: var(--light-mode-display);
	}

	@media (min-width: 768px) {
		.nav {
			display: none;
		}
	}
</style>

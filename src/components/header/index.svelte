<script lang="ts">
	import Logo from "./Logo.svelte";
	import MenuButton from "./MenuButton.svelte";
	import Search from "./Search.svelte";
	import SearchButton from "./SearchButton.svelte";
	import ThemeToggle from "./ThemeButton.svelte";
	import GitHub from "./GitHub.svelte";
	import MobileNav from "./MobileNav.svelte";

	let showMobileNav = false;
	let showSearch = false;
</script>

<header class="header">
	{#if showMobileNav}
		<MobileNav bind:showMobileNav />
	{/if}
	{#if showSearch}
		<div class="header__content">
			<Search />
			<SearchButton bind:showSearch />
		</div>
	{:else}
		<div class="header__content">
			<MenuButton bind:showMobileNav />
			<Logo />

			<div class="header__main">
				<nav class="header__nav">
					<ul class="header__list">
						<li class="header__item"><a class="header__link" href="/data">Data</a></li>
						<li class="header__item"><a class="header__link" href="/articles">Articles</a></li>
						<li class="header__item"><a class="header__link" href="/api">API</a></li>
						<li class="header__item"><a class="header__link" href="/about">About</a></li>
					</ul>
				</nav>
				<GitHub />
				<ThemeToggle />
				<SearchButton bind:showSearch />
			</div>
		</div>
	{/if}
</header>

<style>
	.header {
		background-color: var(--theme-bg);
	}

	.header__content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		height: 56px;
	}

	.header__main {
		display: flex;
	}

	/* .header__nav {
		display: flex;
	} */

	.header__list {
		display: flex;
		list-style: none;
		padding: 0;
	}

	/* ul {
		display: none;
		padding: 0;
		list-style: none;
	} */

	.header__nav {
		display: none;
	}

	/* ul a {
		padding: 0 1rem;
	} */
	.header__item {
		display: flex;
		height: 56px;
		padding: 0 1rem;
		justify-content: center;
		align-items: center;
	}

	.header__link {
		/* width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0 1rem; */
		/* font-size: 14px; */
		font-size: var(--font-size-medium);
		line-height: var(--font-size-medium);
		/* font-weight: 500; */
		color: var(--theme-text);
		text-decoration: none;
	}

	.header__link:hover {
		text-decoration: underline;
	}

	@media (min-width: 768px) {
		/* ul {
			display: flex;
			flex-grow: 1;
			justify-content: center;
		} */

		.header__nav {
			display: flex;
			/* flex-grow: 1; */
			/* justify-content: center; */
			align-items: center;
		}
	}

	@media (min-width: 1024px) {
		.header__content {
			max-width: 1280px;
			margin: 0 auto;
		}
	}

	/* header {
        display: flex;
        justify-content: space-between;
        padding: 1rem;
    } */
</style>

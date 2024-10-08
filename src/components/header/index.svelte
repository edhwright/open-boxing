<script lang="ts">
	import Logo from "./Logo.svelte";
	import MenuButton from "./MenuButton.svelte";
	import Search from "./Search.svelte";
	import SearchButton from "./SearchButton.svelte";
	import GitHub from "./GitHub.svelte";
	import MobileNav from "./MobileNav.svelte";

	let showMobileNav = false;
	let showSearch = false;
</script>

<header class="bg-slate-800">
	{#if showMobileNav}
		<MobileNav bind:showMobileNav />
	{/if}
	{#if showSearch}
		<div class="flex justify-between items-center w-full h-14 lg:max-w-screen-xl lg:mx-auto">
			<Search />
			<SearchButton bind:showSearch />
		</div>
	{:else}
		<div class="flex justify-between items-center w-full h-14 lg:max-w-screen-xl lg:mx-auto">
			<MenuButton bind:showMobileNav />
			<Logo />

			<div class="flex">
				<nav class="hidden md:flex items-center">
					<ul class="flex space-x-4">
						<li class="flex h-14 justify-center items-center"><a class="text-sm text-white hover:underline" href="/data/">Data</a></li>
						<li class="flex h-14 justify-center items-center"><a class="text-sm text-white hover:underline" href="/articles/">Articles</a></li>
						<li class="flex h-14 justify-center items-center"><a class="text-sm text-white hover:underline" href="/api/">API</a></li>
						<li class="flex h-14 justify-center items-center"><a class="text-sm text-white hover:underline" href="/about/">About</a></li>
					</ul>
				</nav>
				<GitHub />
				<SearchButton bind:showSearch />
			</div>
		</div>
	{/if}
</header>

<style>
	/* .header__content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		height: 56px;
	} */

	/* .header__main {
		display: flex;
	} */

	/* .header__nav {
		display: flex;
	} */

	/* .header__list {
		display: flex;
		list-style: none;
		padding: 0;
	} */

	/* ul {
		display: none;
		padding: 0;
		list-style: none;
	} */

	/* .header__nav {
		display: none;
	} */

	/* ul a {
		padding: 0 1rem;
	} */
	/* .header__item {
		display: flex;
		height: 56px;
		padding: 0 1rem;
		justify-content: center;
		align-items: center;
	} */

	/* .header__link { */
	/* width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0 1rem; */
	/* font-size: 14px; */
	/* font-size: var(--font-size-medium); */
	/* line-height: var(--font-size-medium); */
	/* font-weight: 500; */
	/* color: var(--theme-text);
		text-decoration: none; */
	/* } */

	/* .header__link:hover {
		text-decoration: underline;
	} */

	@media (min-width: 768px) {
		/* ul {
			display: flex;
			flex-grow: 1;
			justify-content: center;
		} */
		/* 
		.header__nav {
			display: flex;
			align-items: center;
		} */
	}

	@media (min-width: 1024px) {
		/* .header__content {
			max-width: 1280px;
			margin: 0 auto;
		} */
	}

	/* header {
        display: flex;
        justify-content: space-between;
        padding: 1rem;
    } */
</style>

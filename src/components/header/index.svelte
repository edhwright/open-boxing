<script lang="ts">
	import Logo from "./Logo.svelte";
	import MenuButton from "./MenuButton.svelte";
	import Search from "./Search.svelte";
	import SearchButton from "./SearchButton.svelte";
	import GitHub from "./GitHub.svelte";
	import MobileNav from "./MobileNav.svelte";

	export let currentPath: string = "";

	let showMobileNav = false;
	let showSearch = false;

	const isActive = (href: string) => currentPath === href;
</script>

<header>
	{#if showMobileNav}
		<MobileNav bind:showMobileNav currentPath={currentPath} />
	{/if}
	{#if showSearch}
		<div class="flex justify-between items-center w-full h-14 lg:max-w-7xl lg:mx-auto bg-neutral-800 border-b border-neutral-700 focus-within:border-gold">
			<Search />
			<SearchButton bind:showSearch />
		</div>
	{:else}
		<div class="flex justify-between items-center w-full h-14 lg:max-w-7xl lg:mx-auto">
			<MenuButton bind:showMobileNav />
			<Logo />

			<div class="flex items-center gap-2">
				<nav class="hidden md:flex items-center">
					<ul class="flex space-x-3">
						<li class="flex h-14 justify-center items-center"><a class={`text-sm font-semibold px-3 transition-colors ${isActive('/data/') ? 'text-gold' : 'text-neutral-100 hover:text-neutral-200'}`} href="/data/">Data</a></li>
						<li class="flex h-14 justify-center items-center"><a class={`text-sm font-semibold px-3 transition-colors ${isActive('/articles/') ? 'text-gold' : 'text-neutral-100 hover:text-neutral-200'}`} href="/articles/">Articles</a></li>
						<li class="flex h-14 justify-center items-center"><a class={`text-sm font-semibold px-3 transition-colors ${isActive('/api/') ? 'text-gold' : 'text-neutral-100 hover:text-neutral-200'}`} href="/api/">API</a></li>
						<li class="flex h-14 justify-center items-center"><a class={`text-sm font-semibold px-3 transition-colors ${isActive('/about/') ? 'text-gold' : 'text-neutral-100 hover:text-neutral-200'}`} href="/about/">About</a></li>
					</ul>
				</nav>
				<GitHub />
				<SearchButton bind:showSearch />
			</div>
		</div>
	{/if}
</header>

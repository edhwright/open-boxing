<script lang="ts">
	import MenuButton from "./MenuButton.svelte";
	import { onMount, onDestroy } from "svelte";
	export let showMobileNav: boolean;
	export let currentPath: string = "";

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

	const isActive = (href: string) => currentPath === href;
</script>

<nav class="fixed md:hidden top-0 left-0 w-full h-full bg-neutral-950/90 m-0 p-0 z-50">
	<MenuButton bind:showMobileNav />
	<ul class="my-4 mx-0">
		<li>
			<a class={`w-full block py-3 px-4 text-sm font-semibold transition-colors ${isActive('/data/') ? 'text-gold' : 'text-neutral-100 hover:text-neutral-200'}`} href="/data/">Data</a>
		</li>
		<li>
			<a class={`w-full block py-3 px-4 text-sm font-semibold transition-colors ${isActive('/articles/') ? 'text-gold' : 'text-neutral-100 hover:text-neutral-200'}`} href="/articles/">Articles</a>
		</li>
		<li>
			<a class={`w-full block py-3 px-4 text-sm font-semibold transition-colors ${isActive('/api/') ? 'text-gold' : 'text-neutral-100 hover:text-neutral-200'}`} href="/api/">API</a>
		</li>
		<li>
			<a class={`w-full block py-3 px-4 text-sm font-semibold transition-colors ${isActive('/about/') ? 'text-gold' : 'text-neutral-100 hover:text-neutral-200'}`} href="/about/">About</a>
		</li>
	</ul>
</nav>

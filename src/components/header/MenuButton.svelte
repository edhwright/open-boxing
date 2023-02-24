<script lang="ts">
	export let showMobileNav: boolean;
</script>

{#if !showMobileNav}
	<button class="menu" aria-label="Open menu" on:click={() => (showMobileNav = !showMobileNav)}>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="icon icon-tabler icon-tabler-menu-2"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<line x1="4" y1="6" x2="20" y2="6" />
			<line x1="4" y1="12" x2="20" y2="12" />
			<line x1="4" y1="18" x2="20" y2="18" />
		</svg>
	</button>
{:else}
	<button class="close" aria-label="Open menu" on:click={() => (showMobileNav = !showMobileNav)}>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="icon icon-tabler icon-tabler-x"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="#fff"
			fill="none"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path stroke="none" d="M0 0h24v24H0z" fill="none" />
			<line x1="18" y1="6" x2="6" y2="18" />
			<line x1="6" y1="6" x2="18" y2="18" />
		</svg>
	</button>
{/if}

<style>
	button {
		/* adjust the z-index, so the button is on top of the mobile nav */
		/* z-index: 1; */
		/* height: 100%; */
		height: 56px;
		width: 56px;
		border: 0;
		padding: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		/* background-color: var(--theme-bg); */
		/* margin: 0; */
	}

	.menu > svg {
		stroke: var(--theme-text);
	}

	.menu {
		background-color: var(--theme-bg);
	}

	.menu:hover {
		background-color: var(--theme-border);
		cursor: pointer;
	}

	.close {
		background-color: transparent;
	}

	.close:hover {
		cursor: pointer;
		background-color: rgb(40, 40, 40);
	}

	@media (min-width: 768px) {
		button {
			display: none;
		}
	}
</style>

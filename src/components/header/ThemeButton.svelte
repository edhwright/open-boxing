<script lang="ts">
	import { changeTheme } from "./utils";
</script>

<button class="button" aria-label="Toggle dark mode" on:click={() => changeTheme()}>
	<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path class="button__fill" d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3V21Z" />
		<path
			class="button__outline"
			d="M12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21Z"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
</button>

<style>
	.button {
		display: none;
		background-color: var(--theme-background);
	}

	.button:hover {
		background-color: var(--theme-border);
		cursor: pointer;
	}

	.button__fill {
		fill: var(--theme-text);
	}

	.button__outline {
		stroke: var(--theme-text);
	}

	@media (min-width: 768px) {
		.button {
			display: flex;
			justify-content: center;
			align-items: center;
			height: 56px;
			width: 56px;
			border: 0;
			padding: 0;
		}
	}
</style>

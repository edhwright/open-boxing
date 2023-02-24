<div class="logo">
	<a href="/">
		<div class="belt wba" />
		<div class="belt wbc" />
		<div class="belt ibf" />
		<div class="belt wbo" />
		<div class="belt ring" />
	</a>
</div>

<style>
	.logo {
		height: 28px;
		width: 28px;
		position: relative;
		margin: 0;
		border-radius: 14px;
		background-color: var(--theme-border);
		transition: width 0.5s;
		transition-timing-function: ease;
	}

	.logo:hover {
		cursor: pointer;
		width: calc(((20px * 5) - 4px * 5) + 4px);
	}

	.belt {
		position: absolute;
		width: 20px;
		height: 20px;
		border-radius: 50%;
	}

	.wba {
		transform: translate(4px, 4px);
		background-color: var(--wba-bg);
	}

	.wbc {
		transform: translate(4px, 4px);
		background-color: var(--wbc-bg);
		transition: transform 0.5s;
		transition-timing-function: ease;
	}

	.logo:hover > a > .wbc {
		transform: translate(18px, 4px);
		box-shadow: rgb(0 0 0 / 16%) 0px 1px 4px;
	}

	.ibf {
		transform: translate(4px, 4px);
		background-color: var(--ibf-bg);
		transition: transform 0.5s;
		transition-timing-function: ease;
	}

	.logo:hover > a > .ibf {
		transform: translate(32px, 4px);
		box-shadow: rgb(0 0 0 / 16%) 0px 1px 4px;
	}

	.wbo {
		transform: translate(4px, 4px);
		background-color: var(--wbo-bg);
		transition: transform 0.5s;
		transition-timing-function: ease;
	}

	.logo:hover > a > .wbo {
		transform: translate(46px, 4px);
		box-shadow: rgb(0 0 0 / 16%) 0px 1px 4px;
	}

	.ring {
		width: 22px;
		height: 22px;
		transform: translate(3px, 3px);
		background-color: var(--ring-bg);
		transition: transform 0.5s, width 0.5s, height 0.5s;
		transition-timing-function: ease;
	}

	.logo:hover > a > .ring {
		width: 20px;
		height: 20px;
		transform: translate(60px, 4px);
		box-shadow: rgb(0 0 0 / 16%) 0px 1px 4px;
	}

	@media (min-width: 768px) {
		.logo {
			margin: 0 0 0 12px;
		}
	}

	@media (min-width: 1292px) {
		.logo {
			margin: 0;
		}
	}
</style>

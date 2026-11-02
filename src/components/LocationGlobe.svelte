<script lang="ts">
	import { Plot, Sphere, Geo, Dot, setPlotDefaults } from "svelteplot";
	import { feature } from "topojson-client";
	import type { Topology, GeometryCollection } from "topojson-specification";
	import land110m from "world-atlas/land-110m.json";

	// A small globe turned so the venue is at its centre, with a dot on it, to sit beside the venue's address.
	// Rendered at build time: no JavaScript is sent.
	interface Props {
		latitude: number;
		longitude: number;
		// what the dot marks, for screen readers, e.g. "Shelby Arena, Shelby, Montana, USA"
		label: string;
		size?: number;
		// colours, so the globe can follow the page's theme
		ocean?: string;
		land?: string;
		dot?: string;
		outline?: string;
	}

	let { latitude, longitude, label, size = 56, ocean = "#f4f0ee", land = "#a9a19b", dot = "#c0b38d", outline = "#1a1a17" }: Props = $props();

	// SveltePlot lays a plot out at its starting width (500px) until the browser measures it; there is no browser
	// at build time, so start at the globe's size or it is drawn small inside a 500px-wide viewBox
	setPlotDefaults({ initialWidth: size });

	const world = land110m as unknown as Topology<{ land: GeometryCollection }>;
	const landShape = feature(world, world.objects.land);
	const venue = [{ latitude, longitude }];

	// a colour to use as it is: without scale: null, SveltePlot treats it as a data value and recolours it
	// with its default colour scheme when the page is rendered at build time
	const colour = (value: string) => ({ value, scale: null });
</script>

<figure class="m-0 shrink-0" style:width="{size}px">
	<div role="img" aria-label="A globe centred on {label}">
		<Plot projection={{ type: "orthographic", rotate: [-longitude, -latitude] }} width={size} height={size} margin={1}>
			<Sphere fill={colour(ocean)} stroke={colour(outline)} />
			<Geo data={[landShape]} fill={colour(land)} />
			<Dot data={venue} x="longitude" y="latitude" r={Math.max(3, size / 16)} fill={colour(dot)} stroke={colour(outline)} strokeWidth={1} />
		</Plot>
	</div>
</figure>

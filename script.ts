import { scene, removeTestBox, startControls } from "./src/3.ts";
import { loadLegacyMeshFromBytes, loadMultiresMeshFromBytes } from "./src/ng.ts";

// Type selection
const typeSelectElements = [
	"mesh-legacy",
	"mesh-multires"
].map((id: string) => document.getElementById(id) as HTMLInputElement);
function getCurrentMode() {
	for (let i = 0; i < typeSelectElements.length; i++) {
		if (typeSelectElements[i].checked) {
			return i;
		}
	}
}

// Drop zones
const dropZoneIds = [
	"legacy",
	"info-json",
	"segment-index",
	"segment",
];
const dropZones = {};
for (const id of dropZoneIds) {
	dropZones[id] = document.getElementById(`${id}-dropzone`) as HTMLElement;
	dropZones[id].addEventListener("dragover", ev => {
		ev.preventDefault();
	});
}

dropZones["legacy"].addEventListener("drop", ev => {
	ev.preventDefault();
	const reader = new FileReader();
	reader.onload = ev => {
		const mesh = loadLegacyMeshFromBytes(ev.target!.result as ArrayBuffer);
		scene.add(mesh);
		overlay.parentElement!.remove();
		removeTestBox();
		startControls();
	}
	reader.readAsArrayBuffer((ev as DragEvent).dataTransfer!.files[0]);
});

const multiresComponents: any = {
	info: null,
	index: null,
	mesh: null
};

function tryMultiresLoad() {
	const { info, index, mesh } = multiresComponents;
	if (info === null) return;
	if (index === null) return;
	if (mesh === null) return;

	const meshes = loadMultiresMeshFromBytes(index, mesh, info);
	for (const lod of meshes) {
		for (const chunk of lod) {
			scene.add(chunk);
		}
	}
	console.log("added all chunks");
	overlay.parentElement!.remove();
	removeTestBox();
	startControls();
}

dropZones["info-json"].addEventListener("drop", ev => {
	ev.preventDefault();
	const reader = new FileReader();
	reader.onload = ev => {
		multiresComponents.info = JSON.parse(ev.target!.result as string);
		tryMultiresLoad();
	}
	reader.readAsText((ev as DragEvent).dataTransfer!.files[0]);
});

dropZones["segment-index"].addEventListener("drop", ev => {
	ev.preventDefault();
	const reader = new FileReader();
	reader.onload = ev => {
		multiresComponents.index = ev.target!.result as ArrayBuffer;
		tryMultiresLoad();
	}
	reader.readAsArrayBuffer((ev as DragEvent).dataTransfer!.files[0]);
});

dropZones["segment"].addEventListener("drop", ev => {
	ev.preventDefault();
	const reader = new FileReader();
	reader.onload = ev => {
		multiresComponents.mesh = ev.target!.result as ArrayBuffer;
		tryMultiresLoad();
	}
	reader.readAsArrayBuffer((ev as DragEvent).dataTransfer!.files[0]);
});

// Url input
const urlInput = document.getElementById("url")!;
const loadUrlButton = document.getElementById("load-url") as HTMLButtonElement;
loadUrlButton.addEventListener("click", ev => {
	ev.preventDefault();
});


// Overlay
const overlay = document.getElementById("overlay")!;


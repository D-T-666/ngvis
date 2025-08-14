import { Mesh, BufferGeometry, BufferAttribute, MeshStandardMaterial, DoubleSide } from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

const loader = new DRACOLoader();
loader.setDecoderPath("/thirdparty/draco/");
loader.preload();

export function loadLegacyMeshFromBytes(buffer: ArrayBuffer): Mesh {
	const dv = new DataView(buffer);
	const num_vertices = dv.getUint32(0, true);
	console.log(num_vertices, "vertices");

	const vertices = new Float32Array(buffer, 4, num_vertices * 3);
	const faces = new Uint32Array(buffer, 4 + 12 * num_vertices);
	console.log(faces.length / 3, "faces");

	const geom = new BufferGeometry();
	geom.setIndex(new BufferAttribute(faces, 3));
	geom.setAttribute('position', new BufferAttribute(vertices, 3));
	geom.scale(-1, 1, 1);
	// geom.computeFaceNormals();

	geom.computeVertexNormals();
	return new Mesh(
		geom,
		new MeshStandardMaterial({ color: 0x20e0b7, flatShading: true, side: DoubleSide })
	);
}

export function loadMultiresMeshFromBytes(indexBuffer: ArrayBuffer, meshBuffer: ArrayBuffer, info: any): Mesh[][] {
	// reading the index file
	const dv = new DataView(indexBuffer);
	const index: { [key: string]: any } = {};
	let offsetCounter = 0;
	const offset = () => {
		const res = offsetCounter;
		offsetCounter += 4;
		return res;
	};
	index.chunk_shape = [
		dv.getFloat32(offset(), true),
		dv.getFloat32(offset(), true),
		dv.getFloat32(offset(), true),
	];
	index.grid_origin = [
		dv.getFloat32(offset(), true),
		dv.getFloat32(offset(), true),
		dv.getFloat32(offset(), true),
	];
	index.num_lods = dv.getUint32(offset(), true);
	index.lod_scales = [];
	for (let i = 0; i < index.num_lods; i++) {
		index.lod_scales.push(dv.getFloat32(offset(), true));
	}
	index.vertex_offsets = [];
	for (let i = 0; i < index.num_lods; i++) {
		index.vertex_offsets.push([
			dv.getFloat32(offset(), true),
			dv.getFloat32(offset(), true),
			dv.getFloat32(offset(), true),
		]);
	}
	index.num_fragments_per_lod = [];
	for (let i = 0; i < index.num_lods; i++) {
		index.num_fragments_per_lod.push(dv.getUint32(offset(), true));
	}
	index.fragment_positions = [];
	index.fragment_offsets = [];
	for (let lod = 0; lod < index.num_lods; lod++) {
		index.fragment_positions.push([]);
		for (let i = 0; i < index.num_fragments_per_lod[lod]; i++) {
			index.fragment_positions.push([
				dv.getFloat32(offset(), true),
				dv.getFloat32(offset(), true),
				dv.getFloat32(offset(), true),
			]);
		}
		index.fragment_offsets.push([]);
		for (let i = 0; i < index.num_fragments_per_lod[lod]; i++) {
			index.fragment_offsets[index.fragment_offsets.length - 1].push(dv.getUint32(offset(), true));
		}
	}
	// assert(offset() === dv.length, "index file not read completely *~*");

	// TODO: reading the data file
	const chunks: Mesh[][] = [];
	let _offset = 0;
	for (let i = 0; i < index.num_lods; i++) {
		chunks.push([]);
		for (let j = 0; j < index.num_fragments_per_lod[i]; j++) {
			const buffer = meshBuffer.slice(
				_offset,
				_offset + index.fragment_offsets[i][j],
			);
			console.log(new Uint8Array(buffer), _offset, index.fragment_offsets[i][j]);
			loader.decodeDracoFile(buffer, (geom: THREE.Geometry) => {
				chunks[i].push(new Mesh(
					geom,
					new MeshStandardMaterial({ color: 0x20e0b7, flatShading: true, side: DoubleSide })
				));
				console.log("data file loaded successfully");
			});
			_offset += index.fragment_offsets[i][j];
		}
	}

	return chunks
}


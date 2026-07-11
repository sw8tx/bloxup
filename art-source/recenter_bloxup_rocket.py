from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
BLEND_PATH = ROOT / "art-source" / "bloxup-rocket.blend"
GLB_PATH = ROOT / "public" / "assets" / "3d" / "bloxup-rocket.glb"


def mesh_objects():
    return [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]


def scene_center(objects):
    points = []
    for obj in objects:
        for corner in obj.bound_box:
            points.append(obj.matrix_world @ Vector(corner))

    low = Vector(
        (min(p.x for p in points), min(p.y for p in points), min(p.z for p in points))
    )
    high = Vector(
        (max(p.x for p in points), max(p.y for p in points), max(p.z for p in points))
    )
    return (low + high) * 0.5


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND_PATH))
    objects = mesh_objects()
    center = scene_center(objects)

    for obj in objects:
        obj.location -= center

    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))

    for obj in bpy.context.scene.objects:
        obj.select_set(obj.type == "MESH")

    bpy.ops.export_scene.gltf(
        filepath=str(GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )


if __name__ == "__main__":
    main()

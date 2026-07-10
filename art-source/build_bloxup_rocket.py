"""Build the Bloxup rocket voxel relief from the existing brand logo.

Run from the repository root with Blender 4.3 or newer:

    & 'C:\\Program Files\\Blender Foundation\\Blender 4.3\\blender.exe' \
      --background --factory-startup --python art-source/build_bloxup_rocket.py

The source PNG is sampled into a compact voxel grid.  No hand-drawn substitute
silhouette is used: occupancy, palette class, and relief height all derive from
``public/logo.png``.
"""

from __future__ import annotations

import math
from array import array
from collections import Counter
from pathlib import Path

import bpy
from mathutils import Vector


REPO_ROOT = Path(__file__).resolve().parents[1]
SOURCE_LOGO = REPO_ROOT / "public" / "logo.png"
SOURCE_BLEND = REPO_ROOT / "art-source" / "bloxup-rocket.blend"
PUBLIC_3D_DIR = REPO_ROOT / "public" / "assets" / "3d"
GLB_OUTPUT = PUBLIC_3D_DIR / "bloxup-rocket.glb"
POSTER_OUTPUT = PUBLIC_3D_DIR / "bloxup-rocket-poster.png"
POSTER_WEBP_OUTPUT = PUBLIC_3D_DIR / "bloxup-rocket-poster.webp"

GRID_SIZE = 56
CELL_STEP = 0.19
CELL_FILL = 0.92
ALPHA_THRESHOLD = 0.18
POSTER_SIZE = 1200


PALETTE = {
    "ink": {
        "hex": "050805",
        "depth": 0.39,
        "roughness": 0.29,
        "metallic": 0.18,
    },
    "green_shadow": {
        "hex": "075D1B",
        "depth": 0.51,
        "roughness": 0.35,
        "metallic": 0.08,
    },
    "green_deep": {
        "hex": "0A9D27",
        "depth": 0.62,
        "roughness": 0.32,
        "metallic": 0.06,
    },
    "green_mid": {
        "hex": "16D83A",
        "depth": 0.73,
        "roughness": 0.29,
        "metallic": 0.04,
    },
    "green_acid": {
        "hex": "31F34C",
        "depth": 0.86,
        "roughness": 0.25,
        "metallic": 0.02,
        "emission": 0.08,
    },
    "green_highlight": {
        "hex": "78FF6B",
        "depth": 0.96,
        "roughness": 0.22,
        "metallic": 0.00,
        "emission": 0.14,
    },
    "flame": {
        "hex": "72FF9C",
        "depth": 1.00,
        "roughness": 0.20,
        "metallic": 0.00,
        "emission": 0.65,
    },
    "warm_white": {
        "hex": "FFF7D8",
        "depth": 1.02,
        "roughness": 0.18,
        "metallic": 0.00,
        "emission": 0.12,
    },
}


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for datablock in list(datablocks):
            datablocks.remove(datablock)


def srgb_to_linear(value: float) -> float:
    if value <= 0.04045:
        return value / 12.92
    return ((value + 0.055) / 1.055) ** 2.4


def linear_to_srgb(value: float) -> float:
    value = max(0.0, min(1.0, value))
    if value <= 0.0031308:
        return value * 12.92
    return 1.055 * (value ** (1.0 / 2.4)) - 0.055


def hex_to_linear_rgba(hex_value: str) -> tuple[float, float, float, float]:
    rgb = [int(hex_value[index : index + 2], 16) / 255.0 for index in (0, 2, 4)]
    return tuple(srgb_to_linear(component) for component in rgb) + (1.0,)


def create_material(name: str, spec: dict) -> bpy.types.Material:
    material = bpy.data.materials.new(name=f"BLOX_{name}")
    material.use_nodes = True
    material.diffuse_color = hex_to_linear_rgba(spec["hex"])

    principled = material.node_tree.nodes.get("Principled BSDF")
    color = hex_to_linear_rgba(spec["hex"])
    principled.inputs["Base Color"].default_value = color
    principled.inputs["Metallic"].default_value = spec.get("metallic", 0.0)
    principled.inputs["Roughness"].default_value = spec.get("roughness", 0.3)
    principled.inputs["IOR"].default_value = 1.46

    emission_strength = spec.get("emission", 0.0)
    if emission_strength:
        emission_color = principled.inputs.get("Emission Color")
        emission_input = principled.inputs.get("Emission Strength")
        if emission_color is not None:
            emission_color.default_value = color
        if emission_input is not None:
            emission_input.default_value = emission_strength

    return material


def sample_logo() -> tuple[bpy.types.Image, list[dict]]:
    if not SOURCE_LOGO.exists():
        raise FileNotFoundError(f"Brand source not found: {SOURCE_LOGO}")

    image = bpy.data.images.load(str(SOURCE_LOGO), check_existing=False)
    image.name = "BLOXUP_SOURCE_logo.png"
    image.colorspace_settings.name = "sRGB"
    image.use_fake_user = True
    width, height = image.size

    pixels = array("f", [0.0]) * (width * height * 4)
    image.pixels.foreach_get(pixels)

    cells: list[dict] = []
    for grid_y in range(GRID_SIZE):
        source_y0 = math.floor(grid_y * height / GRID_SIZE)
        source_y1 = max(source_y0 + 1, math.floor((grid_y + 1) * height / GRID_SIZE))

        for grid_x in range(GRID_SIZE):
            source_x0 = math.floor(grid_x * width / GRID_SIZE)
            source_x1 = max(source_x0 + 1, math.floor((grid_x + 1) * width / GRID_SIZE))

            alpha_sum = 0.0
            red_sum = 0.0
            green_sum = 0.0
            blue_sum = 0.0
            sample_count = 0

            for source_y in range(source_y0, min(source_y1, height)):
                row_offset = source_y * width * 4
                for source_x in range(source_x0, min(source_x1, width)):
                    offset = row_offset + source_x * 4
                    alpha = pixels[offset + 3]
                    alpha_sum += alpha
                    red_sum += pixels[offset] * alpha
                    green_sum += pixels[offset + 1] * alpha
                    blue_sum += pixels[offset + 2] * alpha
                    sample_count += 1

            average_alpha = alpha_sum / max(1, sample_count)
            if average_alpha < ALPHA_THRESHOLD or alpha_sum <= 0.0:
                continue

            linear_rgb = (
                red_sum / alpha_sum,
                green_sum / alpha_sum,
                blue_sum / alpha_sum,
            )
            srgb = tuple(linear_to_srgb(component) for component in linear_rgb)
            norm_x = grid_x / (GRID_SIZE - 1)
            norm_y = grid_y / (GRID_SIZE - 1)
            palette_name = classify_color(srgb, norm_x, norm_y, average_alpha)

            cells.append(
                {
                    "grid_x": grid_x,
                    "grid_y": grid_y,
                    "alpha": average_alpha,
                    "palette": palette_name,
                }
            )

    if not cells:
        raise RuntimeError("The source logo produced no visible voxel cells")

    return image, cells


def classify_color(
    rgb: tuple[float, float, float],
    norm_x: float,
    norm_y: float,
    average_alpha: float,
) -> str:
    red, green, blue = rgb
    maximum = max(rgb)
    minimum = min(rgb)
    saturation = 0.0 if maximum == 0.0 else (maximum - minimum) / maximum

    # Keep warm white focused on the porthole.  The source PNG also contains a
    # one-pixel pale antialias contour; treating those low-coverage samples as
    # ink produces a much cleaner three-dimensional silhouette.
    if maximum > 0.68 and saturation < 0.24:
        if 0.61 < norm_x < 0.84 and 0.63 < norm_y < 0.88:
            return "warm_white"
        if norm_x < 0.43 and norm_y < 0.36:
            return "flame"
        return "green_highlight" if average_alpha > 0.56 else "ink"

    # Neutral, nearly black pixels form the logo's characteristic heavy outline.
    if maximum < 0.24 or (saturation < 0.26 and maximum < 0.58):
        return "ink"

    # The exhaust cloud lives in the lower-left of the original composition.
    # It receives the same sampled silhouette but a slightly emissive material.
    if norm_x < 0.43 and norm_y < 0.36 and green > 0.58:
        return "flame"

    if green < 0.34:
        return "green_shadow"
    if green < 0.50:
        return "green_deep"
    if green < 0.68:
        return "green_mid"
    if green < 0.86:
        return "green_acid"
    return "green_highlight"


def add_cuboid(
    vertices: list[tuple[float, float, float]],
    faces: list[tuple[int, int, int, int]],
    material_ids: list[int],
    x_center: float,
    z_center: float,
    width: float,
    height: float,
    depth: float,
    front_material: int,
    side_material: int,
) -> None:
    x0 = x_center - width / 2.0
    x1 = x_center + width / 2.0
    z0 = z_center - height / 2.0
    z1 = z_center + height / 2.0
    y_front = -depth
    y_back = 0.05

    start = len(vertices)
    vertices.extend(
        [
            (x0, y_front, z0),
            (x1, y_front, z0),
            (x1, y_front, z1),
            (x0, y_front, z1),
            (x0, y_back, z0),
            (x1, y_back, z0),
            (x1, y_back, z1),
            (x0, y_back, z1),
        ]
    )
    faces.extend(
        [
            (start + 0, start + 3, start + 2, start + 1),  # front (-Y)
            (start + 4, start + 5, start + 6, start + 7),  # back (+Y)
            (start + 0, start + 4, start + 7, start + 3),  # left
            (start + 1, start + 2, start + 6, start + 5),  # right
            (start + 0, start + 1, start + 5, start + 4),  # bottom
            (start + 3, start + 7, start + 6, start + 2),  # top
        ]
    )
    material_ids.extend(
        [front_material, side_material, side_material, side_material, side_material, side_material]
    )


def build_voxel_mesh(cells: list[dict], materials: dict[str, bpy.types.Material]) -> bpy.types.Object:
    min_grid_x = min(cell["grid_x"] for cell in cells)
    max_grid_x = max(cell["grid_x"] for cell in cells)
    min_grid_y = min(cell["grid_y"] for cell in cells)
    max_grid_y = max(cell["grid_y"] for cell in cells)
    center_grid_x = (min_grid_x + max_grid_x) / 2.0
    center_grid_y = (min_grid_y + max_grid_y) / 2.0

    ordered_material_names = ["side"] + list(PALETTE.keys())
    material_index = {name: index for index, name in enumerate(ordered_material_names)}
    width = CELL_STEP * CELL_FILL

    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int, int]] = []
    material_ids: list[int] = []

    for cell in cells:
        palette_name = cell["palette"]
        base_depth = PALETTE[palette_name]["depth"]
        depth = base_depth * (0.90 + 0.10 * min(1.0, cell["alpha"]))
        add_cuboid(
            vertices,
            faces,
            material_ids,
            x_center=(cell["grid_x"] - center_grid_x) * CELL_STEP,
            z_center=(cell["grid_y"] - center_grid_y) * CELL_STEP,
            width=width,
            height=width,
            depth=depth,
            front_material=material_index[palette_name],
            side_material=material_index["side"],
        )

    mesh = bpy.data.meshes.new("BloxupRocketVoxelMesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(materials["side"])
    for name in PALETTE:
        mesh.materials.append(materials[name])
    for polygon, index in zip(mesh.polygons, material_ids):
        polygon.material_index = index
        polygon.use_smooth = False
    mesh.validate(clean_customdata=False)
    mesh.update()

    model = bpy.data.objects.new("BloxupRocket_VoxelRelief", mesh)
    bpy.context.collection.objects.link(model)
    model["source_asset"] = "public/logo.png"
    model["voxel_grid"] = f"{GRID_SIZE}x{GRID_SIZE}"
    model["voxel_count"] = len(cells)
    model["design_note"] = "Voxel relief sampled directly from the Bloxup pixel-art rocket"

    bevel = model.modifiers.new(name="Micro bevels", type="BEVEL")
    bevel.width = CELL_STEP * 0.055
    bevel.segments = 1
    bevel.limit_method = "ANGLE"
    bevel.angle_limit = math.radians(30.0)
    bevel.harden_normals = True

    bpy.context.view_layer.objects.active = model
    model.select_set(True)
    bpy.ops.object.modifier_apply(modifier=bevel.name)

    return model


def look_at(obj: bpy.types.Object, target: tuple[float, float, float]) -> None:
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_area_light(
    name: str,
    location: tuple[float, float, float],
    energy: float,
    size: float,
    color: tuple[float, float, float],
    target: tuple[float, float, float] = (0.0, -0.35, 0.0),
) -> bpy.types.Object:
    light_data = bpy.data.lights.new(name=name, type="AREA")
    light_data.energy = energy
    light_data.shape = "DISK"
    light_data.size = size
    light_data.color = color
    light_data.use_shadow = True
    light = bpy.data.objects.new(name, light_data)
    bpy.context.collection.objects.link(light)
    light.location = location
    look_at(light, target)
    return light


def configure_render(model: bpy.types.Object) -> bpy.types.Camera:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = POSTER_SIZE
    scene.render.resolution_y = POSTER_SIZE
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 18
    scene.render.filepath = str(POSTER_OUTPUT)

    scene.render.image_settings.color_management = "FOLLOW_SCENE"
    scene.view_settings.view_transform = "AgX"
    for look in ("AgX - Medium High Contrast", "AgX - Medium High Contrast", "Medium High Contrast"):
        try:
            scene.view_settings.look = look
            break
        except TypeError:
            continue
    scene.view_settings.exposure = 0.25

    world = bpy.data.worlds.new("BloxupWorld")
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.008, 0.014, 0.008, 1.0)
    background.inputs["Strength"].default_value = 0.24
    scene.world = world

    camera_data = bpy.data.cameras.new("BloxupHeroCamera")
    camera_data.lens = 61.0
    camera_data.sensor_width = 36.0
    camera_data.dof.use_dof = False
    camera = bpy.data.objects.new("BloxupHeroCamera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (6.4, -19.2, 6.2)
    look_at(camera, (0.15, -0.34, 0.05))
    scene.camera = camera

    add_area_light(
        "Key_Warm",
        (-5.0, -10.0, 11.5),
        energy=1120.0,
        size=5.5,
        color=(1.0, 0.92, 0.78),
    )
    add_area_light(
        "Fill_Acid",
        (8.0, -8.0, 3.5),
        energy=780.0,
        size=4.0,
        color=(0.32, 1.0, 0.38),
    )
    add_area_light(
        "Rim_Green",
        (-8.0, 2.8, 7.5),
        energy=1280.0,
        size=4.5,
        color=(0.15, 1.0, 0.32),
    )
    add_area_light(
        "Top_Softbox",
        (3.0, -1.0, 14.0),
        energy=720.0,
        size=5.0,
        color=(0.82, 1.0, 0.78),
    )

    return camera


def save_blend_with_sources(source_image: bpy.types.Image) -> None:
    source_image.pack()
    source_image.use_fake_user = True

    build_text = bpy.data.texts.get("build_bloxup_rocket.py") or bpy.data.texts.new(
        "build_bloxup_rocket.py"
    )
    build_text.clear()
    build_text.write(Path(__file__).read_text(encoding="utf-8"))

    notes = bpy.data.texts.get("ASSET_INFO.txt") or bpy.data.texts.new("ASSET_INFO.txt")
    notes.clear()
    notes.write(
        "Bloxup rocket voxel relief\n"
        "Source: public/logo.png (packed)\n"
        f"Grid: {GRID_SIZE} x {GRID_SIZE}\n"
        "Rebuild by running the packed script or art-source/build_bloxup_rocket.py.\n"
    )

    bpy.context.preferences.filepaths.use_file_compression = True
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE_BLEND), check_existing=False)


def export_glb(model: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    model.select_set(True)
    bpy.context.view_layer.objects.active = model

    requested_options = {
        "filepath": str(GLB_OUTPUT),
        "check_existing": False,
        "export_format": "GLB",
        "use_selection": True,
        "export_selected": True,
        "export_yup": True,
        "export_apply": True,
        "export_texcoords": False,
        "export_normals": True,
        "export_tangents": False,
        "export_materials": "EXPORT",
        "export_image_format": "AUTO",
        "export_cameras": False,
        "export_lights": False,
        "export_animations": False,
        "export_skins": False,
        "export_morph": False,
        "export_extras": True,
        "export_attributes": False,
        "export_unused_images": False,
        "export_keep_originals": False,
        "export_draco_mesh_compression_enable": True,
        "export_draco_mesh_compression_level": 6,
        "export_draco_position_quantization": 14,
        "export_draco_normal_quantization": 10,
        "export_draco_generic_quantization": 12,
    }
    valid_options = set(bpy.ops.export_scene.gltf.get_rna_type().properties.keys())
    options = {key: value for key, value in requested_options.items() if key in valid_options}
    bpy.ops.export_scene.gltf(**options)


def main() -> None:
    PUBLIC_3D_DIR.mkdir(parents=True, exist_ok=True)
    SOURCE_BLEND.parent.mkdir(parents=True, exist_ok=True)
    clear_scene()

    side_spec = {
        "hex": "020402",
        "roughness": 0.34,
        "metallic": 0.22,
    }
    materials = {"side": create_material("side_extrusion", side_spec)}
    materials.update({name: create_material(name, spec) for name, spec in PALETTE.items()})

    source_image, cells = sample_logo()
    model = build_voxel_mesh(cells, materials)
    configure_render(model)

    palette_counts = Counter(cell["palette"] for cell in cells)
    model["palette_counts"] = ", ".join(
        f"{name}:{palette_counts[name]}" for name in sorted(palette_counts)
    )

    save_blend_with_sources(source_image)
    export_glb(model)
    bpy.context.scene.render.filepath = str(POSTER_OUTPUT)
    bpy.ops.render.render(write_still=True)

    bpy.context.scene.render.image_settings.file_format = "WEBP"
    bpy.context.scene.render.image_settings.color_mode = "RGBA"
    bpy.context.scene.render.image_settings.quality = 86
    bpy.data.images["Render Result"].save_render(
        str(POSTER_WEBP_OUTPUT), scene=bpy.context.scene
    )

    print("BLOXUP_ASSET_BUILD_COMPLETE")
    print(f"source={SOURCE_LOGO}")
    print(f"voxels={len(cells)}")
    print(f"palette={dict(palette_counts)}")
    print(f"blend={SOURCE_BLEND}")
    print(f"glb={GLB_OUTPUT}")
    print(f"poster={POSTER_OUTPUT}")
    print(f"poster_webp={POSTER_WEBP_OUTPUT}")


if __name__ == "__main__":
    main()

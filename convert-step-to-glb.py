#!/usr/bin/env python3
"""
Convert STEP/STP file to GLB format using OCP (OpenCascade) + trimesh.
Uses cadquery for STEP loading and OCP directly for tessellation.
"""

import sys
import os
import time

INPUT_FILE = "/tmp/swerve-convert/swerve drive base.stp"
OUTPUT_FILE = "/home/z/my-project/public/models/armory/swerve.glb"

# Tessellation parameters
LINEAR_DEFLECTION = 0.1  # Lower = more detail, larger file
ANGULAR_DEFLECTION = 0.5

def convert():
    start = time.time()
    
    print(f"Input: {INPUT_FILE}")
    print(f"Output: {OUTPUT_FILE}")
    print(f"Input file size: {os.path.getsize(INPUT_FILE) / 1024 / 1024:.1f} MB")
    
    # Step 1: Load the STEP file using OCP
    print("\n[1/4] Loading STEP file with OCP...")
    t1 = time.time()
    
    from OCP.STEPCAFControl import STEPCAFControl_Reader
    from OCP.TDocStd import TDocStd_Document
    from OCP.TCollection import TCollection_ExtendedString
    
    # Create a document and reader
    doc = TDocStd_Document(TCollection_ExtendedString("TempDoc"))
    reader = STEPCAFControl_Reader()
    
    status = reader.ReadFile(INPUT_FILE)
    if status != 1:  # IFSelect_RetDone
        print(f"ERROR: Failed to read STEP file. Status code: {status}")
        sys.exit(1)
    
    print(f"  STEP file read OK ({time.time() - t1:.1f}s)")
    
    # Step 2: Transfer to document
    print("\n[2/4] Transferring shapes...")
    t2 = time.time()
    
    if not reader.Transfer(doc):
        print("ERROR: Failed to transfer shapes from STEP file")
        sys.exit(1)
    
    from OCP.XCAFDoc import XCAFDoc_DocumentTool
    
    # Get the main shape
    shape_tool = XCAFDoc_DocumentTool.ShapeTool(doc.Main())
    labels = shape_tool.FreeShapes()
    
    print(f"  Found {labels.Length()} top-level shapes")
    print(f"  Transfer completed ({time.time() - t2:.1f}s)")
    
    # Step 3: Tessellate all shapes
    print("\n[3/4] Tessellating shapes...")
    t3 = time.time()
    
    import trimesh
    from OCP.BRepMesh import BRepMesh_IncrementalMesh
    from OCP.TopExp import TopExp_Explorer
    from OCP.TopAbs import TopAbs_FACE
    
    all_meshes = []
    
    for i in range(labels.Length()):
        label = labels.Value(i + 1)
        shape = shape_tool.GetShape(label)
        
        # Mesh this shape using OCP
        mesh = BRepMesh_IncrementalMesh(shape, LINEAR_DEFLECTION, False, ANGULAR_DEFLECTION)
        mesh.SetParallelDefault(True)
        mesh.Perform()
        
        if not mesh.IsDone():
            print(f"  WARNING: Meshing failed for shape {i + 1}")
            continue
        
        # Convert OCP shape to trimesh via cadquery
        import cadquery as cq
        
        # Extract triangles from the meshed shape
        explorer = TopExp_Explorer(shape, TopAbs_FACE)
        face_meshes = []
        
        while explorer.More():
            face = explorer.Current()
            try:
                # Use trimesh's BRep tessellation helper
                tmesh = trimesh.creation.tessellation_from_brep(
                    face,
                    linear_deflection=LINEAR_DEFLECTION,
                    angular_deflection=ANGULAR_DEFLECTION,
                )
                if tmesh is not None and len(tmesh.vertices) > 0:
                    face_meshes.append(tmesh)
            except Exception as e:
                pass
            explorer.Next()
        
        if face_meshes:
            combined_shape = trimesh.util.concatenate(face_meshes) if len(face_meshes) > 1 else face_meshes[0]
            all_meshes.append(combined_shape)
            print(f"  Shape {i + 1}: {len(combined_shape.vertices)} vertices, {len(combined_shape.faces)} faces")
        else:
            print(f"  WARNING: No mesh produced for shape {i + 1}")
    
    print(f"  Tessellation completed ({time.time() - t3:.1f}s)")
    
    if not all_meshes:
        print("ERROR: No meshes were generated!")
        sys.exit(1)
    
    # Step 4: Combine and export to GLB
    print("\n[4/4] Combining meshes and exporting GLB...")
    t4 = time.time()
    
    combined = trimesh.util.concatenate(all_meshes)
    print(f"  Combined mesh: {len(combined.vertices)} vertices, {len(combined.faces)} faces")
    
    combined.merge_vertices()
    combined.remove_unreferenced_vertices()
    combined.fix_normals()
    
    print(f"  After cleanup: {len(combined.vertices)} vertices, {len(combined.faces)} faces")
    
    combined.export(OUTPUT_FILE, file_type='glb')
    
    output_size = os.path.getsize(OUTPUT_FILE) / 1024 / 1024
    print(f"  Exported GLB: {output_size:.1f} MB ({time.time() - t4:.1f}s)")
    
    total_time = time.time() - start
    print(f"\nConversion complete! Total time: {total_time:.1f}s")
    print(f"Output: {OUTPUT_FILE} ({output_size:.1f} MB)")

if __name__ == "__main__":
    convert()

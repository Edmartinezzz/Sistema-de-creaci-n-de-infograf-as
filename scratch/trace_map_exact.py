import sys
import os
from PIL import Image

def get_exact_contour(image_path, target_width=760, target_height=200):
    if not os.path.exists(image_path):
        print(f"Error: {image_path} not found")
        return

    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    
    # Red mask creation
    mask = []
    for y in range(height):
        row = []
        for x in range(width):
            r, g, b, a = img.getpixel((x, y))
            # Match red colors
            # In the provided map, red is #c01f3e or similar
            # Let's do a robust check for red-ish pixels
            is_red = a > 50 and r > 120 and r > g * 1.3 and r > b * 1.3
            row.append(1 if is_red else 0)
        mask.append(row)

    # Let's find connected components or just find the main contiguous boundary
    # We will find all boundary points first
    boundary_points = []
    for y in range(height):
        for x in range(width):
            if mask[y][x] == 1:
                # check if it is on border
                is_border = False
                for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    ny, nx = y + dy, x + dx
                    if ny < 0 or ny >= height or nx < 0 or nx >= width or mask[ny][nx] == 0:
                        is_border = True
                        break
                if is_border:
                    boundary_points.append((x, y))

    if not boundary_points:
        print("Error: No red territory detected in public/mapa.png")
        return

    # Let's group boundary points into contiguous loops/contours
    # and select the largest loop (this automatically discards the Venezuela map inset!)
    visited = set()
    contours = []
    
    for pt in boundary_points:
        if pt in visited:
            continue
        # Trace this contour
        contour = []
        curr = pt
        contour.append(curr)
        visited.add(curr)
        
        while True:
            cx, cy = curr
            next_pt = None
            # Look for unvisited neighbors in a 3x3 box
            for dx in [-1, 0, 1]:
                for dy in [-1, 0, 1]:
                    if dx == 0 and dy == 0: continue
                    np = (cx + dx, cy + dy)
                    if np in boundary_points and np not in visited:
                        next_pt = np
                        break
                if next_pt:
                    break
            
            if next_pt:
                contour.append(next_pt)
                visited.add(next_pt)
                curr = next_pt
            else:
                # Try to connect back to close points to close the loop
                break
        
        if len(contour) > 10: # Only keep significant paths
            contours.append(contour)

    if not contours:
        print("Error: No significant contours found.")
        return

    # Choose the contour with the maximum length (number of points)
    # This will be the main La Guaira shape, completely discarding the smaller inset
    main_contour = max(contours, key=len)
    
    # Scale points to fit target bounds
    min_x = min(p[0] for p in main_contour)
    max_x = max(p[0] for p in main_contour)
    min_y = min(p[1] for p in main_contour)
    max_y = max(p[1] for p in main_contour)
    
    w = max_x - min_x
    h = max_y - min_y
    
    scale = min(target_width / w, target_height / h) * 0.92
    
    scaled_contour = []
    for px, py in main_contour:
        sx = (px - min_x) * scale + (target_width - w * scale) / 2
        sy = (py - min_y) * scale + (target_height - h * scale) / 2
        scaled_contour.append((sx, sy))

    # Douglas-Peucker simplification
    def distance_point_line(p, l1, l2):
        x0, y0 = p
        x1, y1 = l1
        x2, y2 = l2
        num = abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
        den = ((y2 - y1)**2 + (x2 - x1)**2)**0.5
        if den == 0:
            return ((x0 - x1)**2 + (y0 - y1)**2)**0.5
        return num / den

    def rdp(points, epsilon):
        if len(points) < 3:
            return points
        dmax = 0
        index = 0
        end = len(points) - 1
        for i in range(1, end):
            d = distance_point_line(points[i], points[0], points[end])
            if d > dmax:
                index = i
                dmax = d
        if dmax > epsilon:
            results1 = rdp(points[:index+1], epsilon)
            results2 = rdp(points[index:], epsilon)
            return results1[:-1] + results2
        else:
            return [points[0], points[end]]

    # Simplify
    simplified = rdp(scaled_contour, epsilon=1.5)
    
    # Output path
    path_data = f"M {simplified[0][0]:.1f},{simplified[0][1]:.1f} "
    for p in simplified[1:]:
        path_data += f"L {p[0]:.1f},{p[1]:.1f} "
    path_data += "Z"
    
    print("SUCCESS")
    print(path_data)

if __name__ == "__main__":
    get_exact_contour("public/mapa.png")

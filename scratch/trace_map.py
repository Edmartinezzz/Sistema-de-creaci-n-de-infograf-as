import sys
import os
from PIL import Image

def trace_red_contour(image_path, target_width=760, target_height=200):
    if not os.path.exists(image_path):
        print(f"Error: {image_path} not found")
        return

    # Load image and convert to RGBA
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    
    # We want to identify the red pixels (territory of La Guaira)
    # The map color is a solid red (around #C01F3E / #E25B44 or similar)
    # Let's count pixels where Red is high and Blue/Green are low
    mask = []
    for y in range(height):
        row = []
        for x in range(width):
            r, g, b, a = img.getpixel((x, y))
            # Detect red region (red channel dominates, and alpha is not transparent)
            if a > 50 and r > 100 and r > g * 1.5 and r > b * 1.5:
                row.append(1)
            else:
                row.append(0)
        mask.append(row)

    # Let's find the bounding box of the red region
    min_x, max_x = width, 0
    min_y, max_y = height, 0
    
    found = False
    for y in range(height):
        for x in range(width):
            if mask[y][x] == 1:
                found = True
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
                
    if not found:
        print("Error: Could not find any red region in the image.")
        return

    # Extract the contour of the mask
    # We will trace the boundary of the shape
    # Simple contour extraction: find boundary pixels
    boundary_pixels = []
    
    # To trace in a clockwise or simple order, let's collect all boundary pixels
    # A pixel is on the boundary if it is 1 and has at least one 0 neighbor
    for y in range(min_y, max_y + 1):
        for x in range(min_x, max_x + 1):
            if mask[y][x] == 1:
                # Check neighbors
                is_boundary = False
                for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    ny, nx = y + dy, x + dx
                    if ny < 0 or ny >= height or nx < 0 or nx >= width or mask[ny][nx] == 0:
                        is_boundary = True
                        break
                if is_boundary:
                    boundary_pixels.append((x, y))

    if not boundary_pixels:
        print("Error: No boundary found.")
        return

    # Sort boundary pixels to make a continuous loop (Nearest Neighbor TSP heuristic)
    current = boundary_pixels[0]
    unvisited = set(boundary_pixels[1:])
    ordered = [current]
    
    while unvisited:
        # Find nearest neighbor
        cx, cy = current
        nearest = None
        min_dist = float('inf')
        # Search in a small window to speed up
        for p in unvisited:
            dist = (p[0] - cx)**2 + (p[1] - cy)**2
            if dist < min_dist:
                min_dist = dist
                nearest = p
            if dist <= 2: # Very close, stop search early
                nearest = p
                break
        if nearest:
            ordered.append(nearest)
            unvisited.remove(nearest)
            current = nearest
        else:
            break

    # RDP (Ramer-Douglas-Peucker) simplification algorithm to make the SVG path lightweight
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
        
        # Find the point with the maximum distance
        dmax = 0
        index = 0
        end = len(points) - 1
        for i in range(1, end):
            d = distance_point_line(points[i], points[0], points[end])
            if d > dmax:
                index = i
                dmax = d
                
        # If max distance is greater than epsilon, recursively simplify
        if dmax > epsilon:
            results1 = rdp(points[:index+1], epsilon)
            results2 = rdp(points[index:], epsilon)
            return results1[:-1] + results2
        else:
            return [points[0], points[end]]

    # Scale the coordinates to fit target width and height
    bbox_w = max_x - min_x
    bbox_h = max_y - min_y
    
    # Preserve aspect ratio
    scale = min(target_width / bbox_w, target_height / bbox_h) * 0.9
    
    scaled_points = []
    for px, py in ordered:
        sx = (px - min_x) * scale + (target_width - bbox_w * scale) / 2
        sy = (py - min_y) * scale + (target_height - bbox_h * scale) / 2
        scaled_points.append((sx, sy))

    # Simplify
    simplified = rdp(scaled_points, epsilon=2.0)
    
    # Generate SVG Path string
    path_data = f"M {simplified[0][0]:.1f},{simplified[0][1]:.1f} "
    for p in simplified[1:]:
        path_data += f"L {p[0]:.1f},{p[1]:.1f} "
    path_data += "Z"
    
    print("SUCCESS")
    print(path_data)

if __name__ == "__main__":
    trace_red_contour("public/mapa.png")

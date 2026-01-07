#!/usr/bin/env python3
"""
Crop mobile phone screenshots by removing top and bottom parts.

This script processes PNG screenshots and removes a specified number of pixels
from the top and bottom edges, useful for removing status bars, navigation bars,
or other UI elements from mobile phone screenshots.

Supports batch processing of multiple files.

Usage:
    python crop_screenshots.py <input_files...> [--top PIXELS] [--bottom PIXELS] [--output-dir DIR]

Examples:
    # Crop single file
    python crop_screenshots.py screenshot.png --top 100 --bottom 100

    # Crop multiple files
    python crop_screenshots.py img1.png img2.png img3.png --top 150 --bottom 200

    # Crop all PNG files in current directory
    python crop_screenshots.py *.png --top 100 --bottom 100

    # Specify output directory
    python crop_screenshots.py *.png --top 100 --bottom 100 --output-dir ./cropped
"""

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow library is required.")
    print("Install it with: pip install Pillow")
    sys.exit(1)


def crop_screenshot(input_path: str, top: int = 0, bottom: int = 0, output_path: str = None) -> bool:
    """
    Crop a PNG image by removing pixels from top and bottom.

    Args:
        input_path: Path to input PNG file
        top: Number of pixels to remove from top (default: 0)
        bottom: Number of pixels to remove from bottom (default: 0)
        output_path: Path to output file (default: input_cropped.png)

    Returns:
        True if successful, False otherwise
    """
    try:
        # Open the image
        img = Image.open(input_path)
        width, height = img.size

        # Validate crop values
        if top < 0 or bottom < 0:
            print(f"  ✗ Error: Crop values must be non-negative")
            return False

        if top + bottom >= height:
            print(f"  ✗ Error: Cannot crop {top}px from top and {bottom}px from bottom. Image height is only {height}px.")
            return False

        # Calculate crop box (left, upper, right, lower)
        crop_box = (0, top, width, height - bottom)

        # Crop the image
        cropped_img = img.crop(crop_box)

        # Generate output filename if not provided
        if output_path is None:
            input_file = Path(input_path)
            output_path = input_file.parent / f"{input_file.stem}_cropped{input_file.suffix}"

        # Create output directory if it doesn't exist
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        # Save the cropped image
        cropped_img.save(output_path, "PNG")

        new_height = height - top - bottom
        print(f"  ✓ {Path(input_path).name}: {width}x{height} → {width}x{new_height}")
        print(f"    Saved to: {output_path}")
        return True

    except FileNotFoundError:
        print(f"  ✗ Error: File not found: {input_path}")
        return False
    except Exception as e:
        print(f"  ✗ Error processing {input_path}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Crop mobile phone screenshots by removing top and bottom parts. Supports batch processing.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Single file
  %(prog)s screenshot.png --top 100 --bottom 100

  # Multiple files
  %(prog)s img1.png img2.png img3.png --top 150 --bottom 200

  # All PNG files in directory
  %(prog)s *.png --top 100 --bottom 100

  # With output directory
  %(prog)s *.png --top 100 --bottom 100 --output-dir ./cropped
        """
    )

    parser.add_argument(
        "inputs",
        nargs="+",
        help="Input PNG file path(s)"
    )
    parser.add_argument(
        "--top",
        type=int,
        default=0,
        help="Number of pixels to remove from top (default: 0)"
    )
    parser.add_argument(
        "--bottom",
        type=int,
        default=0,
        help="Number of pixels to remove from bottom (default: 0)"
    )
    parser.add_argument(
        "--output-dir",
        "-d",
        help="Output directory (default: same as input with _cropped suffix)"
    )

    args = parser.parse_args()

    # Validate that at least one crop value is provided
    if args.top == 0 and args.bottom == 0:
        print("Warning: No cropping specified. At least one of --top or --bottom should be > 0")
        print("Continuing anyway...")

    print(f"\nCropping {len(args.inputs)} file(s)...")
    print(f"Settings: Remove {args.top}px from top, {args.bottom}px from bottom\n")

    # Process all input files
    success_count = 0
    fail_count = 0

    for input_path in args.inputs:
        # Generate output path
        if args.output_dir:
            output_dir = Path(args.output_dir)
            input_file = Path(input_path)
            output_path = output_dir / f"{input_file.stem}_cropped{input_file.suffix}"
        else:
            output_path = None

        # Crop the screenshot
        if crop_screenshot(input_path, args.top, args.bottom, output_path):
            success_count += 1
        else:
            fail_count += 1

    # Print summary
    print(f"\n{'='*60}")
    print(f"Summary: {success_count} succeeded, {fail_count} failed")
    print(f"{'='*60}")

    # Exit with error code if any failures
    sys.exit(0 if fail_count == 0 else 1)


if __name__ == "__main__":
    main()

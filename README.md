## Obsidian Sage

![demo gif](./media/plot3d_demo.gif)

Live-preview ready Sage Math codeblocks for [Obsidian](https://obsidian.md). Heavily inspired by [the original obsidian-sagecell](https://github.com/EricR/obsidian-sagecell).

To use, create a code block with the custom `sage` language marker, then write some valid Sage.

### Installing

`cd /path/to/vault/.obsidian/plugins`, clone this repo, then `npm i && npm run build` inside. Or, find the plugin on the [showcase](TODO).

### Usage
Create a code block with the custom `sage` language marker, then write some valid Sage. The interactive output will show up once you close the code block and move your cursor out of it.

Errors may not render properly--if nothing shows up, try copying your SageMath code into the [sagecell server](https://sagecell.sagemath.org/) directly. 

### Self Hosting

This plugin uses [the public sagecell server](https://sagecell.sagemath.org/) run by SageMath, Inc (as described on the sagecell server website). You can also [host your own SageCell server](https://github.com/sagemath/sagecell/blob/master/contrib/vm/README.md), then point the `obsidian-sage` plugin to use it in the plugin settings. 


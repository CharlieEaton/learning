#![recursion_limit = "1024"]

#[macro_use]
extern crate error_chain;

extern crate cgmath;
#[macro_use]
extern crate gfx;
extern crate gfx_window_glutin;
extern crate glutin;

mod errors {
    error_chain!{}
}

use errors::*;

use std::time::Instant;

use gfx::traits::FactoryExt;
use gfx::Device;

pub type ColorFormat = gfx::format::Srgba8;
pub type DepthFormat = gfx::format::DepthStencil;

mod light;
mod model;
mod scene;

gfx_defines!{
    vertex Vertex {
        pos: [f32; 2] = "a_Pos",
        color: [f32; 3] = "a_Color",
    }

    pipeline pipe {
        vbuf: gfx::VertexBuffer<Vertex> = (),
        out: gfx::RenderTarget<ColorFormat> = "Target0",
    }
}

const TRIANGLE: [Vertex; 3] = [
    Vertex { pos: [ -0.5, -0.5 ], color: [1.0, 0.0, 0.0] },
    Vertex { pos: [  0.5, -0.5 ], color: [0.0, 1.0, 0.0] },
    Vertex { pos: [  0.0,  0.5 ], color: [0.0, 0.0, 1.0] }
];

const CLEAR_COLOR: [f32; 4] = [0.1, 0.2, 0.3, 1.0];

pub fn main() {
    let builder = glutin::WindowBuilder::new()
        .with_dimensions(1400, 1000)
        .with_title("gfx scratchpad".to_string())
        // Intel HD graphics on my laptop supports up to OpenGL 3.3/GLSL 330
        // Radeon R7 265 on my desktop supports up to OpenGL 4.1/GLSL 410 with open source drivers
        // (the hardware should support OpenGL 4.3)
        .with_gl(glutin::GlRequest::Specific(glutin::Api::OpenGl, (3, 2)))
        .with_gl_profile(glutin::GlProfile::Core)
        .with_depth_buffer(32)
        .with_transparency(true)
        .with_srgb(Some(true))
        .with_vsync();
    let (window, mut device, mut factory, main_color, _main_depth) =
        gfx_window_glutin::init::<ColorFormat, DepthFormat>(builder);
    let mut encoder: gfx::Encoder<_, _> = factory.create_command_buffer().into();
    let pso = factory.create_pipeline_simple(
        include_bytes!("shaders/triangle_150_vertex.glsl"),
        include_bytes!("shaders/triangle_150_fragment.glsl"),
        pipe::new()
    ).unwrap();
    let (vertex_buffer, slice) = factory.create_vertex_buffer_with_slice(&TRIANGLE, ());
    let data = pipe::Data {
        vbuf: vertex_buffer,
        out: main_color
    };

    let frames_per_fps_report = 100;
    let mut frames_drawn_since_last_report = 0;

    'main: loop {
        let frame_start_time = Instant::now();
        frames_drawn_since_last_report += 1;

        // loop over events
        for event in window.poll_events() {
            match event {
                glutin::Event::KeyboardInput(_, _, Some(glutin::VirtualKeyCode::Escape)) |
                glutin::Event::Closed => break 'main,
                _ => {},
            }
        }

        // draw a frame
        encoder.clear(&data.out, CLEAR_COLOR);
        encoder.draw(&slice, &pso, &data);
        encoder.flush(&mut device);
        window.swap_buffers().unwrap();
        device.cleanup();

        if frames_drawn_since_last_report == frames_per_fps_report {
            let frame_render_time = frame_start_time.elapsed();
            let frame_render_time_ns: u64 =
                (frame_render_time.as_secs() * 1000000000u64) + (frame_render_time.subsec_nanos() as u64);
            println!(
                "frame render time: {} us ({} fps)",
                (frame_render_time_ns as f64)/((frames_drawn_since_last_report * 1000) as f64),
                (frames_drawn_since_last_report * 1000000000u64) as f64/(frame_render_time_ns as f64),
            );
            frames_drawn_since_last_report = 0;
        }
    }
}

"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, ArrowUpRight, Check, FileJson, Play, ShieldCheck } from "lucide-react";
import { DEMO_FILM } from "@/features/films/schema";
const FilmPlayer = dynamic(() => import("./FilmPlayer").then((m) => m.FilmPlayer), { ssr: false });
export function FilmHome() {
  return (
    <div className="vf-home">
      <nav className="vf-nav">
        <Link href="/" className="vf-wordmark">
          <span className="vf-symbol">◒</span> vibeframes
        </Link>
        <div>
          <a href="#method">The idea</a>
          <a href="#blocks">Motion library</a>
          <Link className="vf-button vf-small" href="/create">
            Open studio <ArrowUpRight size={15} />
          </Link>
        </div>
      </nav>
      <main>
        <section className="vf-hero">
          <div className="vf-hero-copy">
            <span className="vf-kicker">
              <span className="vf-live-dot" /> FOR AI AUTOMATION AGENCIES
            </span>
            <h1>
              Your agent did
              <br />
              the work.
              <br />
              <em>Let them see it.</em>
            </h1>
            <p>
              Turn a workflow run into a beautifully clear film.
              <br />
              The request, the actions, the human moments.
              <br />
              And what actually came out the other side.
            </p>
            <div className="vf-hero-actions">
              <Link className="vf-button" href="/create">
                Make a workflow film <ArrowUpRight size={18} />
              </Link>
              <a href="#watch" className="vf-watch">
                <Play size={15} /> Watch a sample
              </a>
            </div>
            <div className="vf-hero-foot">
              <FileJson size={14} /> Bring a run. Leave with a story.
            </div>
          </div>
          <div
            className="vf-hero-art"
            aria-label="An illustrated workflow from invoice to recorded match"
          >
            <div className="vf-art-label">
              <span>THE WORK BEHIND THE ANSWER</span>
              <span>01 — 05</span>
            </div>
            <div className="vf-art-orbit" />
            <div className="vf-run-card card-input">
              <div>
                <span className="vf-mini-icon">↙</span>
                <small>THE REQUEST</small>
                <span className="vf-art-time">01</span>
              </div>
              <h3>“Match this invoice.”</h3>
              <p>One request. A little orchestration.</p>
              <div className="vf-file">
                <span>▤</span>
                <div>
                  invoice-1042.pdf<small>Sample document</small>
                </div>
                <Check size={16} />
              </div>
            </div>
            <div className="vf-art-connector">↓</div>
            <div className="vf-run-card card-action">
              <div>
                <span className="vf-mini-icon">⌘</span>
                <small>THE WORK</small>
                <span className="vf-art-time">02 — 04</span>
              </div>
              <div className="vf-action-line">
                <span className="vf-dot" />
                Find the purchase order
                <Check size={14} />
              </div>
              <div className="vf-action-line">
                <span className="vf-dot" />
                Compare the line items
                <Check size={14} />
              </div>
              <div className="vf-human">
                <span>✳</span>
                <div>
                  A human has the final say.<small>Delivery fee reviewed and accepted</small>
                </div>
              </div>
            </div>
            <div className="vf-art-connector">↓</div>
            <div className="vf-run-card card-result">
              <span className="vf-result-check">
                <Check size={22} />
              </span>
              <div>
                <small>THE OUTCOME</small>
                <h3>Matched. With a record.</h3>
                <p>MATCH-1042 · illustrative sample</p>
              </div>
              <ArrowUpRight size={22} />
            </div>
            <div className="vf-art-caption">FROM INVISIBLE LOGIC TO A VISIBLE STORY.</div>
          </div>
        </section>
        <div className="vf-ribbon">
          <span>MADE FOR THE MOMENT SOMEONE ASKS</span>
          <p>
            “But what does your automation <i>actually do?</i>”
          </p>
          <span>↓</span>
        </div>
        <section id="watch" className="vf-showcase">
          <div className="vf-section-head">
            <div>
              <span className="vf-kicker">THE OUTPUT IS THE PRODUCT</span>
              <h2>
                A small film.
                <br />A much clearer picture.
              </h2>
            </div>
            <p>
              Here’s an illustrative invoice-matching run,
              <br />
              composed with the same blocks in your studio.
              <br />
              No screen recording. No imaginary interface.
            </p>
          </div>
          <div className="vf-showcase-player">
            <FilmPlayer film={DEMO_FILM} />
          </div>
          <div className="vf-showcase-meta">
            <span>FOLIO / INVOICE MATCHING</span>
            <span>Illustrative source · 19 seconds · sound-off friendly</span>
            <Link href="/create">
              Remix this film <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>
        <section className="vf-method" id="method">
          <div>
            <span className="vf-kicker">A DIFFERENT KIND OF VIDEO TOOL</span>
            <h2>
              Built from what happened.
              <br />
              <em>Shaped for who’s watching.</em>
            </h2>
            <p>
              Your client doesn’t need a wall of logs. They need to understand the work you built
              for them. Keep the source, lose the noise, and give the story a little motion.
            </p>
            <Link className="vf-text-link" href="/create">
              Start with the sample run <ArrowRight size={16} />
            </Link>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <h3>Bring the run.</h3>
                <p>
                  Import a small JSON of the events you want to show. Review every detail before it
                  becomes a film.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Find the story.</h3>
                <p>
                  Set the audience and takeaway. Compose instantly, or use a connected OpenAI
                  director for an editorial pass.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Make it yours.</h3>
                <p>
                  Change the opening, palette, pacing, and scenes. Export a client-ready MP4 in
                  landscape, portrait, or square.
                </p>
              </div>
            </li>
          </ol>
        </section>
        <section className="vf-blocks" id="blocks">
          <div className="vf-section-head">
            <div>
              <span className="vf-kicker">OUR MOTION VOCABULARY</span>
              <h2>Purpose in every frame.</h2>
            </div>
            <p>
              Custom choreography for the parts
              <br />
              of an automation that deserve to be seen.
            </p>
          </div>
          <div className="vf-block-grid">
            <article>
              <div className="vf-block-preview type-preview">
                A little
                <br />
                <i>clarity.</i>
                <span>01 / TYPE IN MOTION</span>
              </div>
              <h3>Give the problem a voice.</h3>
              <p>
                Considered typography and three opening angles. One clear idea before the machinery
                starts.
              </p>
            </article>
            <article>
              <div className="vf-block-preview trail-preview">
                <div>
                  ↙ <span>Read the request</span>
                  <Check size={13} />
                </div>
                <div>
                  ⌘ <span>Call the right tool</span>
                  <Check size={13} />
                </div>
                <div>
                  ✳ <span>Ask for approval</span>
                  <Check size={13} />
                </div>
                <span>02 / ACTION TRAIL</span>
              </div>
              <h3>Show the invisible steps.</h3>
              <p>
                Tool calls, human reviews, and errors stay tied to the source events you imported.
              </p>
            </article>
            <article>
              <div className="vf-block-preview receipt-preview">
                <div>
                  <small>OUTCOME RECEIPT</small>
                  <h4>
                    Work, with
                    <br />a reference.
                  </h4>
                  <code>record / MATCH-1042</code>
                </div>
                <span>03 / OUTCOME RECEIPT</span>
              </div>
              <h3>End on something concrete.</h3>
              <p>
                The reported result and its evidence reference. Missing evidence stays visibly
                missing.
              </p>
            </article>
          </div>
        </section>
        <section className="vf-honesty">
          <ShieldCheck size={28} />
          <div>
            <h3>A beautiful story should still be an honest one.</h3>
            <p>
              No generated tool calls. No invented ROI. Sample runs are labelled. Source-reported
              outcomes are never presented as independent verification.
            </p>
          </div>
        </section>
        <section className="vf-last">
          <span className="vf-kicker">LESS “TRUST ME.” MORE “LET ME SHOW YOU.”</span>
          <h2>
            Make your next
            <br />
            <em>client conversation clearer.</em>
          </h2>
          <Link href="/create" className="vf-button">
            Open the film studio <ArrowUpRight size={18} />
          </Link>
          <p>Explore the sample. No account required.</p>
        </section>
      </main>
      <footer className="vf-footer">
        <Link href="/" className="vf-wordmark">
          <span className="vf-symbol">◒</span> vibeframes
        </Link>
        <span>Small films for the work behind the scenes.</span>
        <a href="https://github.com/akashp1712/vibeframes">
          Built by Akash <ArrowUpRight size={14} />
        </a>
      </footer>
    </div>
  );
}

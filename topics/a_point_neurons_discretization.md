(point_neurons_discretization)=
# Point Neurons Discretization

Here, we present the derivations based on the **Forward Euler** method to 
discretize the continuous time equations of the $\texttt{IF}$ and $\texttt{LIF}$ 
neurons. The Forward Euler method is a simple numerical method to approximate 
solutions to the first order {term}`Ordinary Differential Equations (ODEs)<ODE>`. 
Note that the equations of the $\texttt{IF}$ (Eq {eq}`eq:continuous-if`) and 
$\texttt{LIF}$ (Eq {eq}`eq:continuous-lif`) neurons are first order ODEs. 
Therefore, we can use the Forward Euler method to discretize and solve them 
numerically on our computers.

(sec:forward-euler)=
## Forward Euler method

Consider 

\begin{equation}
\frac{dy(t)}{dt} = f(t, y)
\label{eq:first-ord-ode}
\end{equation}

and an initial condition $y(t=0) = y_{0}$. In the Forward Euler method, a first 
order ODE is approximated (based on the forward difference derivative) as below:

\begin{equation}
f(t, y) \approx \frac{y(t+h) - y(t)}{h}
\label{eq:forward-euler-cont}
\end{equation}

where $h$ is a very small value, i.e., a very small change in time $t$. Let us 
sample $y(t)$ (defined over continuous time $t$) at discrete times $t_{n}$, i.e.,
$y[t_{n}]$. In the spirit of this discretization, let us also assume that the
difference between consecutive discrete time-steps (i.e., $t_{n+1}$ and $t_{n}$)
is very small, i.e., let $h = t_{n+1} - t_{n}$. Thus, the Eq
{eq}`eq:forward-euler-cont` becomes the following:

\begin{equation}
f(t_{n}, y[t_{n}]) \approx \frac{y[t_{n+1}] - y[t_{n}]}{h}
\label{eq:forward-euler-dsct}
\end{equation}

For convenience, let us replace $y[t_{n+1}]$ and $y[t_{n}]$ with $y[n+1]$ and 
$y[n]$ respectively. Also, for practical purposes, let us replace '$\approx$' 
with '$=$', however, we should keep in mind that Forward Euler method is still an 
_approximation_ and error grows with the value of $h$ as well as accumulates with 
every next time-step. Finally, rearranging the Eq {eq}`eq:forward-euler-dsct` 
gives us the following:

\begin{equation}
y[n+1] = y[n] + h\times f(n, y[n])
\label{eq:forward-euler}
\end{equation}

We can use the formulation of the Eqs {eq}`eq:forward-euler` or 
{eq}`eq:forward-euler-dsct` to derive the discrete-time equations of the
$\texttt{IF}$ and $\texttt{LIF}$ neurons. 

## Discretizing $\texttt{IF}$ neuron
The _continuous-time_ equation of the $\texttt{IF}$ neuron as mentioned in the
[Sec. %s](#sec:spk-nrn-if) is:

```{math}
:label: eq:cont-if
C_\text{m}\frac{dV(t)}{dt} = I(t)
```

To _discretize_ it, let us consider $C_\text{m}=1$, therefore, the Eq
{eq}`eq:cont-if` to discretize becomes:

```{math}
:label: eq:cont-if-1
\frac{dV(t)}{dt} = I(t)
```

As can be easily seen, the Eq {eq}`eq:cont-if-1` is of the same form as Eq
{eq}`eq:first-ord-ode` above, thus, from Eq {eq}`eq:forward-euler`, we get the
following _discrete_ form of Eq {eq}`eq:cont-if-1`:

```{math}
\frac{V[n+1] - V[n]}{h} = f(n, V[n])
```

i.e., 
```{math}
:label: eq:dscrt-if-1
\frac{V[n+1] - V[n]}{h} = I[n]
```
Note that in Eq {eq}`eq:dscrt-if-1`, $h$ denotes the _difference_ between
consecutive timesteps (as mentioned in the [Sec. %s](#sec:forward-euler)), 
therefore, let us assume the _difference_ is $1$ timestep, i.e., $h=1$. Thus,
setting $h=1$ in Eq {eq}`eq:dscrt-if-1`, we get the following:

```{math}
:label: eq:dscrt-if
V[n+1] = V[n] + I[n]
```
which is a _discrete-time_ equation of an $\texttt{IF}$ neuron.


## Discretizing $\texttt{LIF}$ neuron

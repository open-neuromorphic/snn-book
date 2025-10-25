(point_neurons_discretization)=
# Point Neurons Discretization

Here, we present the derivations based on **Forward Euler** method to discretize 
the continuous time equations of the $\texttt{IF}$ and $\texttt{LIF}$ neurons.
Forward Euler method is a simple numerical method to approximate solutions to the
first order Ordinary Differential Equations (ODEs). Note that the equations of
the $\texttt{IF}$ (Eq {eq}`eq:continuous-if`) and $\texttt{LIF}$ 
(Eq {eq}`eq:continuous-lif`) neurons are first order ODEs. Therefore, we can use 
the Forward Euler method to discretize and solve them numerically on our 
computers.

## Forward Euler method

Consider $\frac{dy(t)}{dt} = f(t, y)$ and an initial condition $y(t=0) = y_{0}$. 
In the Forward Euler method, a first order ODE is approximated (based on the 
forward difference derivative) as below:

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

## Discretizing $\texttt{LIF}$ neuron
